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
import api from '../utils/api';
import { HeartbeatLoader, AnimatedCard, PulseDot, FadeIn, SkeletonLoader } from '../components/Animations/Loaders';
import { getRandomQuote } from '../theme/quotes';

const Dashboard = () => {
  const { isConnected, deviceStatus, realtimeECGData } = useSocket();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeSessions: 0,
    totalDevices: 0,
    recentAnalyses: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [systemHealth, setSystemHealth] = useState({ status: 'checking' });
  const [loading, setLoading] = useState(true);
  const [motivationalQuote, setMotivationalQuote] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    setMotivationalQuote(getRandomQuote('wellness'));
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data with error handling for each endpoint
      const results = await Promise.allSettled([
        api.get('/sessions?limit=10'),
        api.get('/devices'),
        api.get('/analysis?limit=20').catch(() => ({ data: [] }))
      ]);

      const sessionsRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
      const devicesRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
      const analysisRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] };

      const allSessions = sessionsRes.data || [];
      const activeSessions = allSessions.filter(s => !s.is_completed);

      setStats({
        totalPatients: 1, // User-based system - showing current user
        activeSessions: activeSessions.length,
        totalDevices: devicesRes.data?.length || 0,
        recentAnalyses: analysisRes.data?.length || 0
      });

      setRecentSessions(allSessions.slice(0, 5));
      await fetchSystemHealth();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setSystemHealth({ status: 'unhealthy', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const backendHealth = await api.get('/health-check');
      
      let mlServiceHealthy = false;
      try {
        await api.get('/analysis');
        mlServiceHealthy = true;
      } catch (mlError) {
        console.warn('ML service may be unavailable:', mlError.message);
      }

      setSystemHealth({
        status: backendHealth.status === 200 ? 'healthy' : 'degraded',
        backend: 'operational',
        mlService: mlServiceHealthy ? 'operational' : 'degraded',
        database: backendHealth.data?.database || 'unknown'
      });
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
      <div className="min-h-screen flex items-center justify-center">
        <HeartbeatLoader message="Loading your dashboard..." size="lg" />
      </div>
    );
  }

  return (
    <FadeIn duration={400}>
      <div className="space-y-6">
        {/* Header with Motivational Quote */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold font-display"
                style={{
                  background: 'linear-gradient(135deg, #F0ABFC, #E879F9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Professional ECG Monitoring Dashboard
            </p>
            {motivationalQuote && (
              <div className="mt-3 bg-gradient-to-r from-primary-50 to-success-50 border border-primary-100 rounded-lg p-3 max-w-2xl">
                <p className="text-sm text-gray-700 italic">"{motivationalQuote.text}"</p>
                <p className="text-xs text-gray-500 mt-1">— {motivationalQuote.author}</p>
              </div>
            )}
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
          >
            <svg 
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* System Status */}
        <AnimatedCard>
          {isConnected && systemHealth.status === 'healthy' ? (
            <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-xl p-4 flex items-center">
              <div className="flex-shrink-0">
                <PulseDot color="success" size="lg" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-success-800 font-semibold flex items-center gap-2">
                  System Status: Operational
                  <CheckCircleIcon className="h-5 w-5" />
                </p>
                <p className="text-success-600 text-sm">All systems are running normally</p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-danger-50 to-warning-50 border border-danger-200 rounded-xl p-4 flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-danger-600 animate-pulse" />
              </div>
              <div className="ml-4">
                <p className="text-danger-800 font-semibold">System Status: {isConnected ? 'Degraded' : 'Offline'}</p>
                <p className="text-danger-600 text-sm">
                  {!isConnected ? 'Connection to server lost' : 'Some services may be unavailable'}
                </p>
              </div>
            </div>
          )}
        </AnimatedCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/patients">
            <AnimatedCard>
              <div className="flex items-center p-6">
                <div className="flex-shrink-0 bg-primary-100 p-3 rounded-xl">
                  <UsersIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-clinical-400">Active User</p>
                  <p className="text-3xl font-bold text-clinical-50">{stats.totalPatients}</p>
                </div>
              </div>
            </AnimatedCard>
          </Link>

          <Link to="/sessions">
            <AnimatedCard>
              <div className="flex items-center p-6">
                <div className="flex-shrink-0 bg-heart-100 p-3 rounded-xl">
                  <HeartIcon className="h-8 w-8 text-heart-600 animate-heartbeat" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-clinical-400">Active Sessions</p>
                  <p className="text-3xl font-bold text-clinical-50">{stats.activeSessions}</p>
                </div>
              </div>
            </AnimatedCard>
          </Link>

          <Link to="/devices">
            <AnimatedCard>
              <div className="flex items-center p-6">
                <div className="flex-shrink-0 bg-success-100 p-3 rounded-xl">
                  <CpuChipIcon className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Connected Devices</p>
                  <p className="text-3xl font-bold text-gray-900">
                    <span className="text-success-600">{getDeviceStatusCount('online')}</span>
                    <span className="text-gray-400">/{stats.totalDevices}</span>
                  </p>
                </div>
              </div>
            </AnimatedCard>
          </Link>

          <Link to="/analysis">
            <AnimatedCard>
              <div className="flex items-center p-6">
                <div className="flex-shrink-0 bg-primary-100 p-3 rounded-xl">
                  <ChartBarIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Analyses</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.recentAnalyses}</p>
                </div>
              </div>
            </AnimatedCard>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <AnimatedCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent ECG Sessions</h3>
                <Link to="/sessions" className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors">
                  View all →
                </Link>
              </div>
              
              {recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all duration-200 hover-lift">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {session.first_name} {session.last_name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {session.session_name || 'ECG Session'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(session.start_time)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          session.is_completed 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-primary-100 text-primary-800 animate-pulse'
                        }`}>
                          {session.is_completed ? '✓ Completed' : '● Active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <HeartIcon className="mx-auto h-16 w-16 text-gray-300 animate-pulse" />
                  <p className="mt-3 text-sm text-gray-500">No recent sessions</p>
                  <Link to="/monitor" className="mt-3 inline-block btn-primary">
                    Start New Session
                  </Link>
                </div>
              )}
            </div>
          </AnimatedCard>

          {/* Live ECG Preview */}
          <AnimatedCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Live ECG Monitor</h3>
                <div className="flex items-center space-x-2">
                  <PulseDot color={realtimeECGData.length > 0 ? 'success' : 'gray'} />
                  <span className="text-sm text-gray-600">
                    {realtimeECGData.length > 0 ? 'Live Signal' : 'No Signal'}
                  </span>
                </div>
              </div>
              
              <div className="h-48 rounded-lg overflow-hidden">
                {realtimeECGData.length > 0 ? (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-success-50 to-primary-50 border-2 border-success-200">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <div className="w-4 h-4 bg-success-500 rounded-full animate-heartbeat"></div>
                        <span className="text-success-700 font-semibold">Live ECG Signal</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {realtimeECGData.length} data points
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Latest: {realtimeECGData[realtimeECGData.length - 1]?.voltage.toFixed(3)}mV
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200">
                    <div className="text-center">
                      <HeartIcon className="mx-auto h-16 w-16 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No active monitoring</p>
                      <Link 
                        to="/monitor" 
                        className="mt-3 inline-block btn-primary"
                      >
                        Start Monitoring
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AnimatedCard>

          {/* Device Status */}
          <AnimatedCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <PulseDot color="success" />
                    <span className="text-sm font-medium text-gray-700">Online Devices</span>
                  </div>
                  <span className="text-success-600 font-bold text-lg">{getDeviceStatusCount('online')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <PulseDot color="warning" />
                    <span className="text-sm font-medium text-gray-700">Recently Active</span>
                  </div>
                  <span className="text-warning-600 font-bold text-lg">{getDeviceStatusCount('recent')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Offline Devices</span>
                  </div>
                  <span className="text-gray-600 font-bold text-lg">{getDeviceStatusCount('offline')}</span>
                </div>
              </div>
              
              {Object.keys(deviceStatus).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Latest Updates</h4>
                  <div className="space-y-2">
                    {Object.entries(deviceStatus).slice(0, 3).map(([deviceId, device]) => (
                      <div key={deviceId} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                        <span className="text-gray-600 font-mono">{deviceId.substring(0, 12)}...</span>
                        <span className="text-gray-500">
                          {device.batteryLevel}% • {formatDate(device.lastUpdate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnimatedCard>

          {/* Quick Actions */}
          <AnimatedCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link 
                  to="/monitor" 
                  className="block w-full btn-primary text-center group"
                >
                  <span className="flex items-center justify-center gap-2">
                    <HeartIcon className="h-5 w-5 group-hover:animate-heartbeat" />
                    Start ECG Monitoring
                  </span>
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
          </AnimatedCard>
        </div>
      </div>
    </FadeIn>
  );
};

export default Dashboard;
