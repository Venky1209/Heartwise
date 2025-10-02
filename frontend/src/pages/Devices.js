import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  SignalIcon,
  SignalSlashIcon,
  BoltIcon,
  CpuChipIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDevices();
    // Refresh device list every 10 seconds
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/devices');
      setDevices(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      case 'recording':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    return status?.toLowerCase() === 'online' || status?.toLowerCase() === 'recording' 
      ? <SignalIcon className="w-5 h-5 text-green-600" />
      : <SignalSlashIcon className="w-5 h-5 text-gray-400" />;
  };

  const getBatteryColor = (level) => {
    if (!level) return 'text-gray-400';
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && devices.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
          <p className="mt-2 text-gray-600">Manage and monitor ECG devices</p>
        </div>
        <div className="medical-card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading devices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
          <p className="mt-2 text-gray-600">Manage and monitor ECG devices</p>
        </div>
        <div className="medical-card text-center py-12">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDevices}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
          <p className="mt-2 text-gray-600">
            {devices.length} device{devices.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button 
          onClick={fetchDevices}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <SignalIcon className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="medical-card text-center py-12">
          <CpuChipIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Devices Found</h3>
          <p className="mt-2 text-gray-600">
            Connect an ESP32 device to start monitoring ECG data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <div key={device.id} className="medical-card hover:shadow-lg transition-shadow">
              {/* Device Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CpuChipIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {device.device_name || device.device_id}
                    </h3>
                    {device.device_name && (
                      <p className="text-sm text-gray-500 font-mono">{device.device_id}</p>
                    )}
                  </div>
                </div>
                {getStatusIcon(device.status)}
              </div>

              {/* Device Status */}
              <div className="mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(device.status)}`}>
                  {device.status || 'Unknown'}
                </span>
              </div>

              {/* Device Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Firmware:</span>
                  <span className="font-medium text-gray-900">
                    {device.firmware_version || 'N/A'}
                  </span>
                </div>

                {device.battery_level !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <BoltIcon className={`w-4 h-4 ${getBatteryColor(device.battery_level)}`} />
                      Battery:
                    </span>
                    <span className={`font-medium ${getBatteryColor(device.battery_level)}`}>
                      {device.battery_level}%
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    Last Seen:
                  </span>
                  <span className="font-medium text-gray-900">
                    {device.last_seen 
                      ? format(new Date(device.last_seen), 'MMM dd, HH:mm')
                      : 'Never'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Registered:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(device.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                  View Details
                </button>
                {device.status === 'online' && (
                  <button className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100">
                    Start Recording
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Devices;