import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { useSocket } from '../../context/SocketContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const RealTimeECGChart = ({ sessionId, height = 400 }) => {
  const { realtimeECGData, isConnected } = useSocket();
  const chartRef = useRef(null);
  const [xAxisRange, setXAxisRange] = useState({ min: null, max: null });
  const [chartData, setChartData] = useState({
    datasets: [
      {
        label: 'ECG Signal',
        data: [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.1,
        fill: false,
      },
    ],
  });

  const [stats, setStats] = useState({
    heartRate: 0,
    signalQuality: 0,
    amplitude: 0,
    lastUpdate: null,
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable animations for real-time data
    },
    interaction: {
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Real-Time ECG Signal (25 mm/s)',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `Voltage: ${context.parsed.y.toFixed(3)} mV`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'second',
          stepSize: 0.2, // 200ms intervals (1 large box on ECG paper)
          displayFormats: {
            second: 'HH:mm:ss',
            millisecond: 'HH:mm:ss.SSS',
          },
          tooltipFormat: 'HH:mm:ss.SSS',
        },
        // Fixed window: only scroll when we have data
        min: xAxisRange.min,
        max: xAxisRange.max,
        title: {
          display: true,
          text: 'Time (Large Box = 200ms, Small Box = 40ms)',
          color: '#6b7280',
          font: {
            size: 11,
          },
        },
        grid: {
          color: function(context) {
            // Safety check for border drawing
            if (!context.tick) return 'rgba(229, 231, 235, 0.2)';
            
            // Create ECG paper grid: dark lines every 200ms (large box), light lines every 40ms (small box)
            const tickValue = context.tick.value;
            const date = new Date(tickValue);
            const ms = date.getMilliseconds();
            
            // Large box every 200ms (darker red lines)
            if (ms % 200 === 0) {
              return 'rgba(239, 68, 68, 0.4)'; // Red
            }
            // Small box every 40ms (lighter pink lines)
            if (ms % 40 === 0) {
              return 'rgba(252, 165, 165, 0.3)'; // Light red/pink
            }
            return 'rgba(229, 231, 235, 0.2)'; // Very light gray for other lines
          },
          lineWidth: function(context) {
            // Safety check for border drawing
            if (!context.tick) return 1;
            
            const tickValue = context.tick.value;
            const date = new Date(tickValue);
            const ms = date.getMilliseconds();
            
            // Thicker lines for large boxes (200ms)
            if (ms % 200 === 0) {
              return 1.5;
            }
            // Thinner lines for small boxes (40ms)
            if (ms % 40 === 0) {
              return 0.8;
            }
            return 0.3;
          },
        },
        ticks: {
          maxTicksLimit: 15,
          color: '#6b7280',
          autoSkip: false,
          callback: function(value, index, ticks) {
            const date = new Date(value);
            const ms = date.getMilliseconds();
            const sec = date.getSeconds();
            
            // Show label every 200ms (large box)
            if (ms % 200 === 0) {
              return `${sec}.${ms}`;
            }
            return '';
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'Voltage (mV)',
          color: '#6b7280',
        },
        grid: {
          color: function(context) {
            // Safety check for border drawing
            if (!context.tick) return 'rgba(229, 231, 235, 0.2)';
            
            const value = context.tick.value;
            // Darker lines every 0.5 mV (large box - standard ECG)
            if (Math.abs(value % 0.5) < 0.01) {
              return 'rgba(239, 68, 68, 0.4)'; // Red
            }
            // Lighter lines every 0.1 mV (small box - standard ECG)
            if (Math.abs(value % 0.1) < 0.01) {
              return 'rgba(252, 165, 165, 0.3)'; // Light red/pink
            }
            return 'rgba(229, 231, 235, 0.2)';
          },
          lineWidth: function(context) {
            // Safety check for border drawing
            if (!context.tick) return 1;
            
            const value = context.tick.value;
            if (Math.abs(value % 0.5) < 0.01) {
              return 1.5;
            }
            if (Math.abs(value % 0.1) < 0.01) {
              return 0.8;
            }
            return 0.3;
          },
        },
        ticks: {
          color: '#6b7280',
          stepSize: 0.5, // Major ticks every 0.5 mV (standard ECG)
          callback: function(value) {
            return value.toFixed(1) + ' mV';
          },
        },
        // Auto-scale based on data range
        min: undefined,
        max: undefined,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };

  useEffect(() => {
    console.log('🎨 Chart update triggered, data length:', realtimeECGData.length);
    
    if (realtimeECGData.length > 0) {
      console.log('📌 Sample data point:', realtimeECGData[0]);
      console.log('🔍 Voltage values - First 5 points:', realtimeECGData.slice(0, 5).map(p => p.voltage));
      console.log('🔍 Min voltage:', Math.min(...realtimeECGData.map(p => p.voltage)));
      console.log('🔍 Max voltage:', Math.max(...realtimeECGData.map(p => p.voltage)));
      
      const now = Date.now();
      const timeWindow = 10000; // Show last 10 seconds (like ECG paper scrolling)
      
      // Filter and map data using display time - keep only last 10 seconds
      const filteredData = realtimeECGData
        .filter(point => {
          // Use displayTime for filtering
          const pointTime = point.displayTime || now;
          return (now - pointTime) <= timeWindow;
        })
        .map(point => {
          // Use the display time for X-axis (properly spaced based on ESP32 timestamps)
          const displayTime = point.displayTime || now;
          // Scale voltage to normal ECG range (divide by 1000 for testing without proper electrodes)
          // Normal ECG: -0.5 to +1.5 mV. Current readings are 1000x higher due to no electrode contact
          const scaledVoltage = point.voltage / 1000;
          return {
            x: new Date(displayTime),
            y: scaledVoltage,
          };
        })
        .sort((a, b) => a.x - b.x);

      console.log('📊 Filtered data length:', filteredData.length);
      console.log('📍 First filtered point:', filteredData[0]);
      console.log('📍 Last filtered point:', filteredData[filteredData.length - 1]);
      console.log('🔍 Y-axis range in filtered data:', {
        min: Math.min(...filteredData.map(p => p.y)),
        max: Math.max(...filteredData.map(p => p.y))
      });

      // Set scrolling X-axis range based on ACTUAL DATA, not current time
      if (filteredData.length > 0) {
        const latestDataTime = filteredData[filteredData.length - 1].x.getTime();
        setXAxisRange({
          min: latestDataTime - 5000,  // 5 seconds window for better visibility
          max: latestDataTime + 500     // 0.5 second after latest data for smooth scrolling
        });
      }

      setChartData(prevData => ({
        ...prevData,
        datasets: [
          {
            ...prevData.datasets[0],
            data: filteredData,
          },
        ],
      }));

      // Calculate basic statistics
      if (filteredData.length > 0) {
        const voltages = filteredData.map(d => d.y);
        // const avgVoltage = voltages.reduce((sum, v) => sum + v, 0) / voltages.length;
        const maxVoltage = Math.max(...voltages);
        const minVoltage = Math.min(...voltages);
        const amplitude = maxVoltage - minVoltage;

        // Basic heart rate estimation (very simplified)
        const peaks = findPeaks(voltages);
        const heartRate = estimateHeartRate(peaks, filteredData.length, 250); // Assuming 250 Hz sample rate

        // Calculate signal quality based on amplitude and noise
        const signalQuality = calculateSignalQuality(voltages);

        setStats({
          heartRate: Math.round(heartRate),
          signalQuality: Math.round(signalQuality * 100),
          amplitude: amplitude.toFixed(3),
          lastUpdate: new Date(),
        });
      }
    }
  }, [realtimeECGData]);

  // NO continuous scrolling - chart only updates when new data arrives

  const findPeaks = (data) => {
    const peaks = [];
    const threshold = 0.5; // Minimum peak height
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > threshold) {
        peaks.push(i);
      }
    }
    return peaks;
  };

  const estimateHeartRate = (peaks, totalSamples, sampleRate) => {
    if (peaks.length < 2) return 0;
    
    const timeDuration = totalSamples / sampleRate; // in seconds
    const beatsCount = peaks.length - 1;
    const heartRate = (beatsCount / timeDuration) * 60; // beats per minute
    
    return Math.min(Math.max(heartRate, 40), 200); // Clamp between 40-200 BPM
  };

  const calculateSignalQuality = (voltages) => {
    if (voltages.length === 0) return 0;
    
    const mean = voltages.reduce((sum, v) => sum + v, 0) / voltages.length;
    const variance = voltages.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / voltages.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Simple quality metric based on signal-to-noise ratio
    const amplitude = Math.max(...voltages) - Math.min(...voltages);
    const quality = Math.min(amplitude / (standardDeviation + 0.1), 1);
    
    return quality;
  };

  const getHeartRateStatus = (hr) => {
    if (hr === 0) return { status: 'no-signal', color: 'text-gray-500' };
    if (hr < 60) return { status: 'bradycardia', color: 'text-blue-600' };
    if (hr > 100) return { status: 'tachycardia', color: 'text-red-600' };
    return { status: 'normal', color: 'text-green-600' };
  };

  const getQualityStatus = (quality) => {
    if (quality >= 80) return { status: 'excellent', color: 'text-green-600' };
    if (quality >= 60) return { status: 'good', color: 'text-blue-600' };
    if (quality >= 40) return { status: 'fair', color: 'text-yellow-600' };
    return { status: 'poor', color: 'text-red-600' };
  };

  const hrStatus = getHeartRateStatus(stats.heartRate);
  const qualityStatus = getQualityStatus(stats.signalQuality);

  return (
    <div className="medical-card">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Real-Time ECG Monitor</h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`status-light ${isConnected ? 'online' : 'offline'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {sessionId && (
            <span className="text-xs text-gray-500">
              Session: {sessionId.substring(0, 8)}...
            </span>
          )}
        </div>
      </div>

      {/* Vital Signs Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Heart Rate</p>
          <p className={`text-2xl font-bold ${hrStatus.color}`}>
            {stats.heartRate} <span className="text-sm font-normal">BPM</span>
          </p>
          <p className="text-xs text-gray-500 capitalize">{hrStatus.status.replace('-', ' ')}</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Signal Quality</p>
          <p className={`text-2xl font-bold ${qualityStatus.color}`}>
            {stats.signalQuality}<span className="text-sm font-normal">%</span>
          </p>
          <p className="text-xs text-gray-500 capitalize">{qualityStatus.status}</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Amplitude</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.amplitude} <span className="text-sm font-normal">mV</span>
          </p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Data Points</p>
          <p className="text-2xl font-bold text-gray-900">
            {realtimeECGData.length}
          </p>
          <p className="text-xs text-gray-500">
            {stats.lastUpdate ? `Updated ${stats.lastUpdate.toLocaleTimeString()}` : 'No data'}
          </p>
        </div>
      </div>

      {/* ECG Chart */}
      <div className="ecg-container" style={{ height: `${height}px` }}>
        {realtimeECGData.length > 0 ? (
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-pulse mb-4">
                <div className="h-2 bg-gray-300 rounded w-48 mx-auto mb-2"></div>
                <div className="h-2 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
                <div className="h-2 bg-gray-300 rounded w-40 mx-auto"></div>
              </div>
              <p className="text-gray-500">Waiting for ECG signal...</p>
              <p className="text-sm text-gray-400 mt-1">
                Ensure device is connected and properly positioned
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Time Window: 5 seconds</span>
          <span>Sample Rate: 250 Hz</span>
          <span>Voltage Range: ±2 mV</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {realtimeECGData.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {stats.heartRate > 0 && (
        <div className="mt-4">
          {stats.heartRate > 120 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ High heart rate detected ({stats.heartRate} BPM)
              </p>
            </div>
          )}
          {stats.heartRate < 50 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm font-medium">
                ℹ️ Low heart rate detected ({stats.heartRate} BPM)
              </p>
            </div>
          )}
          {stats.signalQuality < 40 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm font-medium">
                ⚡ Poor signal quality - check electrode placement
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeECGChart;