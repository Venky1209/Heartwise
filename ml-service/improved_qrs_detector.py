"""
Improved ECG Analyzer with Better QRS Detection
Handles signals with DC offset and variable amplitude
"""

import numpy as np
from scipy import signal as scipy_signal
from scipy.signal import find_peaks

def analyze_ecg_improved(voltage_data, sample_rate=250):
    """
    Improved ECG analysis with robust QRS detection
    
    Args:
        voltage_data: Array of voltage values (mV)
        sample_rate: Sampling rate in Hz (default 250)
    
    Returns:
        dict with heart_rate, qrs_count, hrv metrics
    """
    
    # Convert to numpy array
    if not isinstance(voltage_data, np.ndarray):
        voltage_data = np.array(voltage_data, dtype=np.float64)
    
    # Remove NaN and Inf
    voltage_data = voltage_data[np.isfinite(voltage_data)]
    
    if len(voltage_data) < sample_rate:  # Need at least 1 second
        return {
            'heart_rate': 0,
            'qrs_count': 0,
            'rr_intervals': [],
            'hrv_sdnn': 0,
            'hrv_rmssd': 0,
            'signal_quality': 'poor'
        }
    
    # Step 1: Remove DC offset (IMPORTANT!)
    voltage_data = voltage_data - np.mean(voltage_data)
    
    # Step 2: Bandpass filter (5-15 Hz for QRS)
    nyquist = sample_rate / 2
    low = 5.0 / nyquist
    high = 15.0 / nyquist
    
    try:
        b, a = scipy_signal.butter(4, [low, high], btype='band')
        filtered = scipy_signal.filtfilt(b, a, voltage_data)
    except:
        filtered = voltage_data
    
    # Step 3: Differentiate to emphasize QRS slopes
    differentiated = np.diff(filtered)
    differentiated = np.append(differentiated, 0)
    
    # Step 4: Square to make all values positive
    squared = differentiated ** 2
    
    # Step 5: Moving average integration
    window_size = int(0.15 * sample_rate)  # 150ms window
    if window_size < 1:
        window_size = 1
    integrated = np.convolve(squared, np.ones(window_size)/window_size, mode='same')
    
    # Step 6: Adaptive peak detection
    # Use dynamic threshold based on signal statistics
    threshold = np.mean(integrated) + 0.3 * np.std(integrated)
    
    # Find peaks with minimum distance of 200ms (300 BPM max)
    min_distance = int(0.2 * sample_rate)
    
    try:
        peaks, properties = find_peaks(
            integrated,
            height=threshold,
            distance=min_distance,
            prominence=threshold * 0.5
        )
    except:
        peaks = []
    
    qrs_count = len(peaks)
    
    # Calculate heart rate
    if qrs_count < 2:
        return {
            'heart_rate': 0,
            'qrs_count': qrs_count,
            'rr_intervals': [],
            'hrv_sdnn': 0,
            'hrv_rmssd': 0,
            'signal_quality': 'poor',
            'signal_stats': {
                'mean': float(np.mean(voltage_data)),
                'std': float(np.std(voltage_data)),
                'threshold_used': float(threshold),
                'peaks_found': qrs_count
            }
        }
    
    # Calculate RR intervals in seconds
    rr_intervals = np.diff(peaks) / sample_rate
    
    # Filter out unrealistic RR intervals (30-200 BPM range)
    valid_rr = rr_intervals[(rr_intervals > 0.3) & (rr_intervals < 2.0)]
    
    if len(valid_rr) == 0:
        return {
            'heart_rate': 0,
            'qrs_count': qrs_count,
            'rr_intervals': [],
            'hrv_sdnn': 0,
            'hrv_rmssd': 0,
            'signal_quality': 'poor'
        }
    
    # Calculate metrics
    heart_rate = 60.0 / np.mean(valid_rr) if len(valid_rr) > 0 else 0
    
    # HRV metrics
    hrv_sdnn = np.std(valid_rr) * 1000  # Convert to ms
    hrv_rmssd = np.sqrt(np.mean(np.diff(valid_rr) ** 2)) * 1000 if len(valid_rr) > 1 else 0
    
    # Signal quality assessment
    if len(valid_rr) >= 5 and hrv_sdnn > 0:
        signal_quality = 'good'
    elif len(valid_rr) >= 3:
        signal_quality = 'fair'
    else:
        signal_quality = 'poor'
    
    return {
        'heart_rate': float(heart_rate),
        'qrs_count': int(qrs_count),
        'rr_intervals': valid_rr.tolist(),
        'hrv_sdnn': float(hrv_sdnn),
        'hrv_rmssd': float(hrv_rmssd),
        'signal_quality': signal_quality,
        'signal_stats': {
            'original_mean': float(np.mean(voltage_data + np.mean(voltage_data))),
            'filtered_std': float(np.std(filtered)),
            'threshold_used': float(threshold),
            'peaks_found': qrs_count,
            'valid_peaks': len(valid_rr) + 1
        }
    }


# Test function
if __name__ == "__main__":
    # Test with sample data
    print("Testing improved ECG analyzer...")
    
    # Generate test signal (75 BPM)
    sample_rate = 250
    duration = 10
    t = np.linspace(0, duration, sample_rate * duration)
    
    # Simulate ECG with QRS complexes
    hr = 75
    ecg_signal = []
    for i in range(len(t)):
        time = t[i]
        # P-QRS-T wave simulation
        beat_phase = (time * hr / 60) % 1
        
        if 0.1 < beat_phase < 0.2:  # QRS
            value = 1000 * np.exp(-((beat_phase - 0.15) ** 2) / 0.0001)
        elif 0.3 < beat_phase < 0.5:  # T wave
            value = 300 * np.sin((beat_phase - 0.3) * np.pi / 0.2)
        else:
            value = 0
        
        ecg_signal.append(value - 200)  # Add DC offset like real data
    
    # Analyze
    result = analyze_ecg_improved(ecg_signal, sample_rate)
    
    print(f"\n✅ Test Results:")
    print(f"Heart Rate: {result['heart_rate']:.1f} BPM")
    print(f"QRS Count: {result['qrs_count']}")
    print(f"HRV SDNN: {result['hrv_sdnn']:.1f} ms")
    print(f"HRV RMSSD: {result['hrv_rmssd']:.1f} ms")
    print(f"Signal Quality: {result['signal_quality']}")
    print(f"\nSignal Stats:")
    for key, value in result.get('signal_stats', {}).items():
        print(f"  {key}: {value}")
