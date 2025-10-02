/**
 * ECG Signal Processing and Analysis Utilities
 * Implements Pan-Tompkins QRS Detection Algorithm
 */

class ECGAnalyzer {
  constructor() {
    this.samplingRate = 250; // Hz
  }

  /**
   * Pan-Tompkins QRS Detection Algorithm
   * Returns R-peak indices in the ECG signal
   */
  detectQRS(signal) {
    // Filter out NaN and Infinity values
    const cleanSignal = signal.filter(val => !isNaN(val) && isFinite(val));
    
    if (cleanSignal.length < 100) {
      console.log('❌ Insufficient valid data points after cleaning');
      return [];
    }
    
    console.log(`\n🔬 Starting QRS Detection:`);
    console.log(`  Input signal length: ${cleanSignal.length} samples (${signal.length - cleanSignal.length} invalid values removed)`);
    console.log(`  Signal range: ${Math.min(...cleanSignal).toFixed(2)} to ${Math.max(...cleanSignal).toFixed(2)} mV`);
    console.log(`  Signal mean: ${(cleanSignal.reduce((a,b) => a+b, 0) / cleanSignal.length).toFixed(2)} mV`);
    
    // Step 1: Bandpass filter (5-15 Hz)
    const filtered = this.bandpassFilter(cleanSignal);
    console.log(`  ✓ Bandpass filtered`);
    
    // Step 2: Derivative (emphasize QRS slope)
    const derivative = this.derivative(filtered);
    console.log(`  ✓ Derivative calculated`);
    
    // Step 3: Squaring (amplify higher frequencies)
    const squared = derivative.map(x => x * x);
    console.log(`  ✓ Signal squared`);
    
    // Step 4: Moving window integration
    const integrated = this.movingWindowIntegration(squared, 30); // 30 samples = 120ms window
    console.log(`  ✓ Moving window integration complete`);
    
    // Step 5: Adaptive thresholding to find R-peaks
    const rPeaks = this.findRPeaks(integrated, cleanSignal);
    
    return rPeaks;
  }

  /**
   * Bandpass filter (5-15 Hz) for QRS enhancement
   */
  bandpassFilter(signal) {
    // Simple moving average lowpass followed by highpass
    const lowpass = this.lowpassFilter(signal, 15);
    const highpass = this.highpassFilter(lowpass, 5);
    return highpass;
  }

  /**
   * Lowpass filter using moving average
   */
  lowpassFilter(signal, cutoffHz) {
    const windowSize = Math.floor(this.samplingRate / cutoffHz);
    const filtered = [];
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - windowSize); j <= Math.min(signal.length - 1, i + windowSize); j++) {
        sum += signal[j];
        count++;
      }
      
      filtered.push(sum / count);
    }
    
    return filtered;
  }

  /**
   * Highpass filter (signal - lowpass)
   */
  highpassFilter(signal, cutoffHz) {
    const lowpass = this.lowpassFilter(signal, cutoffHz);
    return signal.map((val, i) => val - lowpass[i]);
  }

  /**
   * Derivative filter (emphasizes slopes)
   */
  derivative(signal) {
    const derivative = [];
    
    for (let i = 2; i < signal.length - 2; i++) {
      // 5-point derivative: (1/8T)(-x[n-2] - 2x[n-1] + 2x[n+1] + x[n+2])
      const value = (
        -signal[i - 2] - 2 * signal[i - 1] + 
        2 * signal[i + 1] + signal[i + 2]
      ) / 8;
      derivative.push(value);
    }
    
    return derivative;
  }

  /**
   * Moving window integration
   */
  movingWindowIntegration(signal, windowSize) {
    const integrated = [];
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      const start = Math.max(0, i - windowSize + 1);
      
      for (let j = start; j <= i; j++) {
        sum += signal[j];
      }
      
      integrated.push(sum / windowSize);
    }
    
    return integrated;
  }

  /**
   * Find R-peaks using adaptive thresholding
   */
  findRPeaks(integrated, originalSignal) {
    const rPeaks = [];
    const threshold = this.calculateAdaptiveThreshold(integrated);
    const minPeakDistance = Math.floor(this.samplingRate * 0.3); // Minimum 300ms between peaks (200 BPM max)
    
    // Debug logging
    console.log(`🔍 R-Peak Detection Debug:`);
    console.log(`  Signal length: ${integrated.length}`);
    console.log(`  Threshold: ${threshold.toFixed(2)}`);
    console.log(`  Min peak distance: ${minPeakDistance}`);
    console.log(`  Integrated signal range: ${Math.min(...integrated).toFixed(2)} to ${Math.max(...integrated).toFixed(2)}`);
    
    let inPeak = false;
    let peakStart = 0;
    let lastPeakIndex = -minPeakDistance;
    
    for (let i = 1; i < integrated.length - 1; i++) {
      if (integrated[i] > threshold && !inPeak && (i - lastPeakIndex) >= minPeakDistance) {
        // Start of potential QRS complex
        inPeak = true;
        peakStart = i;
      } else if (integrated[i] < threshold && inPeak) {
        // End of QRS complex - find max in original signal
        const peakIndex = this.findMaxInRange(originalSignal, peakStart, i);
        rPeaks.push(peakIndex);
        lastPeakIndex = peakIndex;
        inPeak = false;
      }
    }
    
    console.log(`  ✓ Found ${rPeaks.length} R-peaks`);
    
    return rPeaks;
  }

  /**
   * Calculate adaptive threshold (15% of max for better AD8232 detection)
   */
  calculateAdaptiveThreshold(signal) {
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const range = max - min;
    // Use 15% of range above baseline for maximum sensitivity with noisy AD8232 signals
    return min + (range * 0.15);
  }

  /**
   * Find index of maximum value in range
   */
  findMaxInRange(signal, start, end) {
    let maxIndex = start;
    let maxValue = signal[start];
    
    for (let i = start + 1; i <= end; i++) {
      if (signal[i] > maxValue) {
        maxValue = signal[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }

  /**
   * Calculate R-R intervals from R-peaks
   */
  calculateRRIntervals(rPeaks) {
    const rrIntervals = [];
    
    for (let i = 1; i < rPeaks.length; i++) {
      const interval = (rPeaks[i] - rPeaks[i - 1]) / this.samplingRate * 1000; // in ms
      rrIntervals.push(interval);
    }
    
    return rrIntervals;
  }

  /**
   * Calculate heart rate from R-R intervals
   */
  calculateHeartRate(rrIntervals) {
    if (rrIntervals.length === 0) return 0;
    
    const avgRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
    return Math.round(60000 / avgRR); // BPM
  }

  /**
   * Calculate Heart Rate Variability (HRV) metrics
   */
  calculateHRV(rrIntervals) {
    if (rrIntervals.length < 2) {
      return { sdnn: 0, rmssd: 0, pnn50: 0 };
    }

    // SDNN - Standard deviation of NN intervals
    const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
    const variance = rrIntervals.reduce((sum, rr) => sum + Math.pow(rr - mean, 2), 0) / rrIntervals.length;
    const sdnn = Math.sqrt(variance);

    // RMSSD - Root mean square of successive differences
    let sumSquaredDiff = 0;
    for (let i = 1; i < rrIntervals.length; i++) {
      sumSquaredDiff += Math.pow(rrIntervals[i] - rrIntervals[i - 1], 2);
    }
    const rmssd = Math.sqrt(sumSquaredDiff / (rrIntervals.length - 1));

    // pNN50 - Percentage of successive differences > 50ms
    let nn50Count = 0;
    for (let i = 1; i < rrIntervals.length; i++) {
      if (Math.abs(rrIntervals[i] - rrIntervals[i - 1]) > 50) {
        nn50Count++;
      }
    }
    const pnn50 = (nn50Count / (rrIntervals.length - 1)) * 100;

    return { sdnn, rmssd, pnn50 };
  }

  /**
   * Detect arrhythmias based on R-R intervals
   */
  detectArrhythmias(rrIntervals, heartRate) {
    const arrhythmias = [];

    // Bradycardia (HR < 60 BPM)
    if (heartRate < 60 && heartRate > 0) {
      arrhythmias.push({
        type: 'Bradycardia',
        severity: 'low',
        description: 'Heart rate below 60 BPM'
      });
    }

    // Tachycardia (HR > 100 BPM)
    if (heartRate > 100) {
      arrhythmias.push({
        type: 'Tachycardia',
        severity: heartRate > 120 ? 'high' : 'medium',
        description: `Heart rate above 100 BPM (${heartRate} BPM)`
      });
    }

    // Irregular rhythm (high HRV)
    if (rrIntervals.length >= 2) {
      const hrv = this.calculateHRV(rrIntervals);
      
      if (hrv.sdnn > 100) {
        arrhythmias.push({
          type: 'Irregular Rhythm',
          severity: 'medium',
          description: 'High heart rate variability detected'
        });
      }
    }

    // Check for very irregular beats (possible AFib)
    const irregularBeats = this.detectIrregularBeats(rrIntervals);
    if (irregularBeats > 0.3) { // More than 30% irregular
      arrhythmias.push({
        type: 'Possible Atrial Fibrillation',
        severity: 'high',
        description: 'Highly irregular rhythm detected'
      });
    }

    return arrhythmias;
  }

  /**
   * Detect irregular beats (ratio of irregular RR intervals)
   */
  detectIrregularBeats(rrIntervals) {
    if (rrIntervals.length < 3) return 0;

    let irregularCount = 0;
    const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;

    for (let i = 0; i < rrIntervals.length; i++) {
      // If interval deviates more than 20% from mean, consider irregular
      if (Math.abs(rrIntervals[i] - mean) > mean * 0.2) {
        irregularCount++;
      }
    }

    return irregularCount / rrIntervals.length;
  }

  /**
   * Analyze complete ECG session
   */
  analyzeSession(ecgData) {
    try {
      // Extract voltage values
      const signal = ecgData.map(point => point.voltage_mv || point.voltage || 0);

      // Detect QRS complexes
      const rPeaks = this.detectQRS(signal);

      // Calculate R-R intervals
      const rrIntervals = this.calculateRRIntervals(rPeaks);

      // Calculate heart rate
      const heartRate = this.calculateHeartRate(rrIntervals);

      // Calculate HRV
      const hrv = this.calculateHRV(rrIntervals);

      // Detect arrhythmias
      const arrhythmias = this.detectArrhythmias(rrIntervals, heartRate);

      // Calculate signal quality
      const signalQuality = this.assessSignalQuality(signal);

      return {
        success: true,
        metrics: {
          heartRate,
          rPeakCount: rPeaks.length,
          avgRRInterval: rrIntervals.length > 0 
            ? rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length 
            : 0,
          hrv,
          signalQuality
        },
        arrhythmias,
        rPeaks,
        rrIntervals
      };
    } catch (error) {
      console.error('Error analyzing ECG session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Assess signal quality
   */
  assessSignalQuality(signal) {
    // Calculate signal-to-noise ratio (simplified)
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
    const stdDev = Math.sqrt(variance);

    // Check for flat line (very low variance)
    if (stdDev < 10) {
      return { score: 0, status: 'Poor - Flat signal' };
    }

    // Check for excessive noise (very high variance)
    if (stdDev > 500) {
      return { score: 30, status: 'Poor - Noisy signal' };
    }

    // Good signal
    const score = Math.min(100, Math.max(0, 100 - (Math.abs(stdDev - 100) / 5)));
    
    let status;
    if (score > 80) status = 'Excellent';
    else if (score > 60) status = 'Good';
    else if (score > 40) status = 'Fair';
    else status = 'Poor';

    return { score: Math.round(score), status };
  }
}

module.exports = new ECGAnalyzer();
