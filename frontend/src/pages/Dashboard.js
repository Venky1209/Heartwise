import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  UsersIcon, 
  ChartBarIcon, 
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const Dashboard = () => {
  const { isConnected, deviceStatus, realtimeECGData } = useSocket();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeSessions: 0,
    totalDevices: 0,
    recentAnalyses: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats in parallel
      const [patientsRes, sessionsRes, devicesRes, analysisRes] = await Promise.all([
        axios.get('/api/patients?limit=1'),
        axios.get('/api/sessions?limit=5'),
        axios.get('/api/devices'),
        axios.get('/api/analysis?limit=1')
      ]);

      setStats({
        totalPatients: patientsRes.data.pagination?.totalPatients || 0,
        activeSessions: sessionsRes.data.filter(s => !s.is_completed).length,
        totalDevices: devicesRes.data.length,
        recentAnalyses: analysisRes.data.length
      });

      setRecentSessions(sessionsRes.data.slice(0, 5));
      
      await fetchSystemHealth();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await axios.get('/api/health');
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
      setSystemHealth({ status: 'unhealthy', error: error.message });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceStatusCount = (status) => {
    return Object.values(deviceStatus).filter(device => {
      const lastSeen = new Date(device.lastUpdate);
      const now = new Date();
      const minutesAgo = (now - lastSeen) / (1000 * 60);
      
      switch (status) {
        case 'online':
          return minutesAgo < 5;
        case 'recent':
          return minutesAgo >= 5 && minutesAgo < 60;
        default:
          return minutesAgo >= 60;
      }
    }).length;
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your HeartWise ECG monitoring system</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="medical-card">
              <div className="loading-pulse h-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to HeartWise ECG Monitoring System - Professional healthcare at home
        </p>
      </div>

      {/* System Status Alert */}
      <div className="mb-6">
        {isConnected && systemHealth.status === 'healthy' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="text-green-800 font-medium">System Status: Operational</p>
              <p className="text-green-600 text-sm">All systems are running normally</p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <p className="text-red-800 font-medium">System Status: {isConnected ? 'Degraded' : 'Offline'}</p>
              <p className="text-red-600 text-sm">
                {!isConnected ? 'Connection to server lost' : 'Some services may be unavailable'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/patients" className="medical-card hover:scale-105 transition-transform">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
            </div>
          </div>
        </Link>

        <Link to="/sessions" className="medical-card hover:scale-105 transition-transform">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HeartIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSessions}</p>
            </div>
          </div>
        </Link>

        <Link to="/devices" className="medical-card hover:scale-105 transition-transform">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CpuChipIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Connected Devices</p>
              <p className="text-2xl font-bold text-gray-900">
                {getDeviceStatusCount('online')}/{stats.totalDevices}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/analysis" className="medical-card hover:scale-105 transition-transform">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentAnalyses}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sessions */}
        <div className="medical-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent ECG Sessions</h3>
            <Link to="/sessions" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>
          
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {session.first_name} {session.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.session_name || 'ECG Session'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(session.start_time)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.is_completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {session.is_completed ? 'Completed' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No recent sessions</p>
              <Link to="/monitor" className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                Start new session
              </Link>
            </div>
          )}
        </div>

        {/* Live ECG Preview */}
        <div className="medical-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Live ECG Monitor</h3>
            <div className="flex items-center space-x-2">
              <div className={`status-light ${realtimeECGData.length > 0 ? 'online' : 'offline'}`}></div>
              <span className="text-sm text-gray-600">
                {realtimeECGData.length > 0 ? 'Receiving Data' : 'No Signal'}
              </span>
            </div>
          </div>
          
          <div className="ecg-container h-48">
            {realtimeECGData.length > 0 ? (
              <div className="h-full flex items-center justify-center bg-ecg-pattern">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">Live ECG Signal</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {realtimeECGData.length} data points received
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Latest: {realtimeECGData[realtimeECGData.length - 1]?.voltage.toFixed(3)}mV
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <HeartIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500">No active ECG monitoring</p>
                  <Link 
                    to="/monitor" 
                    className="mt-2 inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Start Monitoring
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Device Status */}
        <div className="medical-card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Online Devices</span>
              <span className="text-green-600 font-medium">{getDeviceStatusCount('online')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recently Active</span>
              <span className="text-yellow-600 font-medium">{getDeviceStatusCount('recent')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Offline Devices</span>
              <span className="text-red-600 font-medium">{getDeviceStatusCount('offline')}</span>
            </div>
          </div>
          
          {Object.keys(deviceStatus).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Latest Device Updates</h4>
              <div className="space-y-2">
                {Object.entries(deviceStatus).slice(0, 3).map(([deviceId, device]) => (
                  <div key={deviceId} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{deviceId.substring(0, 8)}...</span>
                    <span className="text-gray-500">
                      {device.batteryLevel}% • {formatDate(device.lastUpdate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="medical-card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="space-y-3">
            <Link 
              to="/monitor" 
              className="block w-full btn-primary text-center"
            >
              Start ECG Monitoring
            </Link>
            <Link 
              to="/patients" 
              className="block w-full btn-secondary text-center"
            >
              Manage Patients
            </Link>
            <Link 
              to="/analysis" 
              className="block w-full btn-secondary text-center"
            >
              View Analysis Results
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;