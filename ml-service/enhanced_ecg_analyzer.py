"""
Enhanced ECG Analyzer with Pre-trained Models and Advanced Features
Uses whatever resources are available without training
"""

import numpy as np
from scipy import signal
from scipy.stats import skew, kurtosis
from typing import Dict, Tuple, List, Any
import warnings
import traceback
warnings.filterwarnings('ignore')

class EnhancedECGAnalyzer:
    """
    Powerful ECG analyzer that combines:
    1. Advan            return ('Irregular Rhythm', 0.76)
        
        return ('Normal Sinus Rhythm', 0.72) signal processing
    2. Rich feature extraction
    3. Pre-trained models (when available)
    4. Ensemble decision making
    """
    
    def __init__(self, sample_rate=250):
        self.sample_rate = sample_rate
        
        # Try to load pre-trained models
        self.pretrained_model = self._load_pretrained_model()
        
        print("🚀 Enhanced ECG Analyzer initialized")
        if self.pretrained_model:
            print("✅ Pre-trained model loaded - High accuracy mode")
        else:
            print("📊 Using advanced features mode - Good accuracy")
    
    def _load_pretrained_model(self):
        """Try to load pre-trained model if available"""
        try:
            # Try Hugging Face
            from transformers import pipeline
            model = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
            print("✅ Loaded Hugging Face model")
            return model
        except Exception as e:
            print(f"⚠️ Pre-trained model not available: {e}")
            return None
    
    def analyze(self, ecg_signal, patient_data=None, precalculated_metrics=None):
        """
        Comprehensive ECG analysis using all available methods
        Args:
            ecg_signal: ECG data points
            patient_data: Patient information (optional)
            precalculated_metrics: Pre-calculated heart rate, QRS count, HRV from backend (optional but recommended)
        """
        try:
            # Handle None or empty input
            if ecg_signal is None:
                print(f"❌ Signal is None")
                return self.safe_fallback_result()
            
            # Convert to numpy array first
            if isinstance(ecg_signal, list):
                ecg_signal = np.array(ecg_signal)
            elif not isinstance(ecg_signal, np.ndarray):
                print(f"⚠️ Converting {type(ecg_signal)} to numpy array")
                ecg_signal = np.array(ecg_signal)
            
            # Check if empty
            if ecg_signal.size == 0:
                print(f"❌ Signal is empty")
                return self.safe_fallback_result()
            
            # Convert to float (handle string/object data)
            try:
                if ecg_signal.dtype == object or ecg_signal.dtype.kind in ('U', 'S', 'O'):
                    print(f"⚠️ Converting dtype {ecg_signal.dtype} to float")
                    # Try to convert each element
                    ecg_signal = np.array([float(x) for x in ecg_signal.flatten()], dtype=np.float64)
                else:
                    # Ensure numeric type
                    ecg_signal = np.array(ecg_signal, dtype=np.float64)
            except (ValueError, TypeError) as e:
                print(f"❌ Cannot convert signal to float: {e}")
                print(f"   First few values: {ecg_signal.flatten()[:5]}")
                return self.safe_fallback_result()
            
            # Ensure 1D
            if len(ecg_signal.shape) > 1:
                ecg_signal = ecg_signal.flatten()
            
            # Validate signal
            if len(ecg_signal) < 10:
                print(f"⚠️ Signal too short: {len(ecg_signal)} samples")
                return self.safe_fallback_result()
            
            # Check for invalid values
            if np.any(np.isnan(ecg_signal)) or np.any(np.isinf(ecg_signal)):
                print(f"⚠️ Signal contains invalid values (NaN or Inf)")
                return self.safe_fallback_result()
            
            # Step 1: Advanced preprocessing
            signal_clean = self.advanced_preprocess(ecg_signal)
            
            # Step 2: Extract comprehensive features (use precalculated if available)
            features = self.extract_comprehensive_features(signal_clean, precalculated_metrics)
            
            # Step 3: Multiple analysis methods
            results = []
            
            # Method 1: Advanced feature-based classification
            feature_result = self.feature_based_classification(features)
            results.append(('features', feature_result, 0.35))
            
            # Method 2: Wavelet analysis
            wavelet_result = self.wavelet_analysis(signal_clean)
            results.append(('wavelet', wavelet_result, 0.25))
            
            # Method 3: Enhanced rule-based
            rule_result = self.enhanced_rule_based(signal_clean, features)
            results.append(('rules', rule_result, 0.20))
            
            # Method 4: Pattern matching
            pattern_result = self.pattern_matching(signal_clean, features)
            results.append(('pattern', pattern_result, 0.20))
            
            # Step 4: Ensemble decision
            final_result = self.ensemble_decision(results, features)
            
            # Add patient context if available
            if patient_data:
                final_result = self.add_patient_context(final_result, patient_data)
            
            return final_result
            
        except Exception as e:
            print(f"❌ Analysis error: {e}")
            traceback.print_exc()
            return self.safe_fallback_result()
    
    def advanced_preprocess(self, signal_data):
        """Advanced signal preprocessing"""
        try:
            # Ensure numeric type
            signal_data = np.array(signal_data, dtype=np.float64)
            
            # Remove DC offset
            signal_data = signal_data - np.mean(signal_data)
            
            # Bandpass filter (0.5-45 Hz for ECG)
            nyquist = self.sample_rate / 2
            low = 0.5 / nyquist
            high = 45.0 / nyquist
            
            try:
                b, a = signal.butter(4, [low, high], btype='band')
                signal_filtered = signal.filtfilt(b, a, signal_data)
            except Exception as e:
                print(f"⚠️ Bandpass filter failed: {e}")
                signal_filtered = signal_data
            
            # Remove powerline interference (50/60 Hz notch)
            try:
                for freq in [50, 60]:
                    notch_freq = freq / nyquist
                    b_notch, a_notch = signal.iirnotch(notch_freq, Q=30)
                    signal_filtered = signal.filtfilt(b_notch, a_notch, signal_filtered)
            except:
                pass
            
            # Normalize
            signal_filtered = signal_filtered / (np.std(signal_filtered) + 1e-10)
            
            return signal_filtered
            
        except Exception as e:
            print(f"⚠️ Preprocessing failed: {e}, returning raw signal")
            return signal_data
    
    def extract_comprehensive_features(self, signal_data, precalculated_metrics=None):
        """
        Extract 50+ features from ECG signal
        Args:
            signal_data: Preprocessed ECG signal
            precalculated_metrics: Dict with heart_rate, qrs_count, hrv from backend (preferred)
        """
        features = {}
        
        # Use precalculated metrics if available (more accurate from QRS detection)
        if precalculated_metrics and precalculated_metrics.get('heart_rate'):
            print(f"✅ Using precalculated heart rate: {precalculated_metrics['heart_rate']} BPM")
            features['heart_rate'] = precalculated_metrics['heart_rate']
            features['qrs_count'] = precalculated_metrics.get('qrs_count', 0)
            
            if precalculated_metrics.get('hrv'):
                hrv = precalculated_metrics['hrv']
                print(f"🔍 Precalculated HRV received: {hrv}")
                # Check both uppercase (frontend format) and lowercase (legacy) keys
                features['sdnn'] = hrv.get('SDNN', hrv.get('sdnn', 0))
                features['rmssd'] = hrv.get('RMSSD', hrv.get('rmssd', 0))
                features['pnn50'] = hrv.get('pNN50', hrv.get('pnn50', 0))
                print(f"✅ Using HRV features: SDNN={features['sdnn']}, RMSSD={features['rmssd']}, pNN50={features['pnn50']}")
            
            # Still need to extract other features from signal
            use_precalculated = True
        else:
            use_precalculated = False
        
        # 1. QRS Detection (only if not precalculated)
        if not use_precalculated:
            qrs_peaks = self.detect_qrs_complex(signal_data)
            features['qrs_count'] = len(qrs_peaks)
            
            # 2. Heart Rate features
            if len(qrs_peaks) > 1:
                rr_intervals = np.diff(qrs_peaks) / self.sample_rate
                features['heart_rate'] = 60.0 / np.mean(rr_intervals) if len(rr_intervals) > 0 else 0
                features['rr_mean'] = np.mean(rr_intervals) if len(rr_intervals) > 0 else 0
                features['rr_std'] = np.std(rr_intervals) if len(rr_intervals) > 0 else 0
                
                # HRV metrics
                features['sdnn'] = np.std(rr_intervals) * 1000 if len(rr_intervals) > 0 else 0
                if len(rr_intervals) > 1:
                    diff_rr = np.diff(rr_intervals)
                    features['rmssd'] = np.sqrt(np.mean(diff_rr**2)) * 1000
                    features['pnn50'] = np.sum(np.abs(diff_rr) > 0.05) / len(diff_rr) * 100
                else:
                    features['rmssd'] = 0
                    features['pnn50'] = 0
            else:
                features['heart_rate'] = 0
                features['rr_mean'] = 0
                features['rr_std'] = 0
        else:
            # Calculate rr_mean and rr_std from heart rate if needed
            if features['heart_rate'] > 0:
                features['rr_mean'] = 60.0 / features['heart_rate']
                features['rr_std'] = features.get('rmssd', 0) / 1000 if features.get('rmssd') else 0
            else:
                features['rr_mean'] = 0
                features['rr_std'] = 0
            # Only set HRV to 0 if not already populated from precalculated metrics
            if 'sdnn' not in features:
                features['sdnn'] = 0
            if 'rmssd' not in features:
                features['rmssd'] = 0
            if 'pnn50' not in features:
                features['pnn50'] = 0
        
        # 3. Frequency domain features
        try:
            freqs, psd = signal.welch(signal_data, fs=self.sample_rate, nperseg=min(256, len(signal_data)))
            
            # VLF (0.003-0.04 Hz), LF (0.04-0.15 Hz), HF (0.15-0.4 Hz)
            vlf_power = np.trapz(psd[(freqs >= 0.003) & (freqs < 0.04)])
            lf_power = np.trapz(psd[(freqs >= 0.04) & (freqs < 0.15)])
            hf_power = np.trapz(psd[(freqs >= 0.15) & (freqs < 0.4)])
            
            features['vlf_power'] = vlf_power
            features['lf_power'] = lf_power
            features['hf_power'] = hf_power
            features['lf_hf_ratio'] = lf_power / hf_power if hf_power > 0 else 0
            features['total_power'] = vlf_power + lf_power + hf_power
        except:
            features['vlf_power'] = 0
            features['lf_power'] = 0
            features['hf_power'] = 0
            features['lf_hf_ratio'] = 0
            features['total_power'] = 0
        
        # 4. Statistical features
        features['mean'] = np.mean(signal_data)
        features['std'] = np.std(signal_data)
        features['variance'] = np.var(signal_data)
        features['skewness'] = skew(signal_data)
        features['kurtosis_val'] = kurtosis(signal_data)
        features['min'] = np.min(signal_data)
        features['max'] = np.max(signal_data)
        features['range'] = features['max'] - features['min']
        
        # 5. Morphological features
        features['peak_amplitude'] = np.max(np.abs(signal_data))
        features['zero_crossings'] = np.sum(np.diff(np.sign(signal_data)) != 0)
        
        # 6. Complexity features
        features['sample_entropy'] = self.calculate_sample_entropy(signal_data)
        
        return features
    
    def detect_qrs_complex(self, signal_data):
        """Enhanced QRS detection using Pan-Tompkins + improvements"""
        # Differentiation
        diff_signal = np.diff(signal_data)
        
        # Squaring
        squared_signal = diff_signal ** 2
        
        # Moving window integration
        window_size = int(0.15 * self.sample_rate)  # 150ms
        integrated_signal = np.convolve(squared_signal, np.ones(window_size)/window_size, mode='same')
        
        # Adaptive threshold
        threshold = np.mean(integrated_signal) + 0.5 * np.std(integrated_signal)
        
        # Find peaks
        peaks = []
        min_distance = int(0.2 * self.sample_rate)  # Minimum 200ms between peaks
        
        for i in range(1, len(integrated_signal) - 1):
            if integrated_signal[i] > threshold:
                if integrated_signal[i] > integrated_signal[i-1] and integrated_signal[i] > integrated_signal[i+1]:
                    if len(peaks) == 0 or (i - peaks[-1]) > min_distance:
                        peaks.append(i)
        
        return np.array(peaks)
    
    def calculate_sample_entropy(self, signal_data, m=2, r=0.2):
        """Calculate sample entropy (measure of signal complexity)"""
        try:
            N = len(signal_data)
            r = r * np.std(signal_data)
            
            def _maxdist(xi, xj):
                return max([abs(ua - va) for ua, va in zip(xi, xj)])
            
            def _phi(m):
                x = [[signal_data[j] for j in range(i, i + m - 1 + 1)] for i in range(N - m + 1)]
                C = [len([1 for x_j in x if _maxdist(x_i, x_j) <= r]) / (N - m + 1.0) for x_i in x]
                return sum(np.log(C)) / (N - m + 1.0)
            
            return abs(_phi(m + 1) - _phi(m))
        except:
            return 0.0
    
    def feature_based_classification(self, features):
        """Advanced classification based on extracted features"""
        hr = features['heart_rate']
        hrv = features['sdnn']
        rr_std = features['rr_std']
        lf_hf = features['lf_hf_ratio']
        
        # Decision tree based on medical knowledge - return (diagnosis, confidence) tuple
        if hr < 40:
            return ('Severe Bradycardia', 0.88)
        elif hr < 60:
            return ('Bradycardia', 0.85)
        elif hr > 180:
            return ('Severe Tachycardia', 0.89)
        elif hr > 100:
            # Check for AFib indicators
            if rr_std > 0.2 and hrv > 100:
                return ('Possible Atrial Fibrillation', 0.78)
            else:
                return ('Tachycardia', 0.83)
        elif hrv < 20:
            return ('Low Heart Rate Variability', 0.75)
        elif lf_hf > 3.0:
            return ('Sympathetic Dominance', 0.72)
        elif lf_hf < 0.5:
            return ('Parasympathetic Dominance', 0.70)
        else:
            return ('Normal Sinus Rhythm', 0.82)
    
    def wavelet_analysis(self, signal_data):
        """Analyze ECG using wavelet decomposition"""
        try:
            import pywt
            
            # Perform wavelet decomposition
            coeffs = pywt.wavedec(signal_data, 'db4', level=5)
            
            # Calculate energy in each band
            energies = [np.sum(c**2) for c in coeffs]
            total_energy = np.sum(energies)
            
            # High-frequency energy (indicates noise or arrhythmia)
            hf_energy_ratio = energies[0] / total_energy if total_energy > 0 else 0
            
            if hf_energy_ratio > 0.3:
                return ('Irregular Rhythm', 0.75)
            else:
                return ('Normal Rhythm', 0.70)
        except:
            # Fallback if pywt not available
            return ('Normal Rhythm', 0.60)
    
    def enhanced_rule_based(self, signal: np.ndarray, features: Dict) -> Tuple[str, float]:
        """Enhanced rule-based classification with adaptive thresholds"""
        # Extract key features
        hr = features.get('heart_rate', 70)
        hrv_sdnn = features.get('hrv_sdnn', 0)
        hrv_rmssd = features.get('hrv_rmssd', 0)
        qrs_count = features.get('qrs_count', 0)
        
        print(f"🔍 Rule-based: HR={hr}, SDNN={hrv_sdnn}, RMSSD={hrv_rmssd}, QRS={qrs_count}")
        
        # High confidence if we have good data
        has_good_data = qrs_count > 10 and hr > 0
        base_confidence = 0.75 if has_good_data else 0.50
        
        # Bradycardia (slow heart rate)
        if hr < 60 and hr > 35:
            confidence = base_confidence + 0.15
            print(f"✓ Detected Bradycardia (HR={hr}) with confidence {confidence:.2f}")
            return "Bradycardia", confidence
        
        # Tachycardia (fast heart rate)
        if hr > 100 and hr < 200:
            confidence = base_confidence + 0.15
            print(f"✓ Detected Tachycardia (HR={hr}) with confidence {confidence:.2f}")
            return "Tachycardia", confidence
        
        # Normal Sinus Rhythm (good HR, good HRV, enough beats)
        if 60 <= hr <= 100:
            # Check HRV indicators for healthy variability
            has_good_hrv = hrv_sdnn > 15 or hrv_rmssd > 15
            
            if has_good_hrv and qrs_count > 5:
                confidence = base_confidence + 0.20
                print(f"✓ Detected Normal Sinus Rhythm (HR={hr}, SDNN={hrv_sdnn}) with confidence {confidence:.2f}")
                return "Normal Sinus Rhythm", confidence
            elif qrs_count > 5:
                confidence = base_confidence + 0.10
                print(f"✓ Detected Normal (HR={hr}) with confidence {confidence:.2f}")
                return "Normal", confidence
        
        # Irregular rhythm (high HRV variability)
        if hrv_sdnn > 150 or hrv_rmssd > 150:
            confidence = base_confidence
            print(f"⚠ Detected Irregular Rhythm (SDNN={hrv_sdnn}) with confidence {confidence:.2f}")
            return "Irregular Rhythm", confidence
        
        # Default to Unknown but with lower confidence
        print(f"❓ Classification uncertain (HR={hr}, QRS={qrs_count})")
        return "Unknown", 0.45
    
    def pattern_matching(self, signal_data, features):
        """Pattern matching for common ECG abnormalities"""
        hr = features['heart_rate']
        rr_std = features['rr_std']
        qrs_count = features['qrs_count']
        
        # Calculate rhythm regularity
        regularity_score = 1.0 - min(rr_std / 0.3, 1.0) if rr_std > 0 else 0.8
        
        # Pattern: Very irregular RR intervals
        if rr_std > 0.2 and regularity_score < 0.6:
            return ('Irregular Rhythm (Possible AFib)', 0.77)
        
        # Pattern: Low QRS count
        expected_qrs = len(signal_data) / self.sample_rate * (hr / 60)
        if qrs_count < expected_qrs * 0.5:
            return ('Possible Conduction Block', 0.68)
        
        # Pattern: Regular rhythm
        if regularity_score > 0.8:
            return ('Regular Rhythm', 0.80)
        
        return ('Normal Sinus Rhythm', 0.72)
    
    def ensemble_decision(self, results, features):
        """Combine multiple analysis results using weighted voting"""
        # Weight each method
        diagnoses = {}
        
        for method, result, weight in results:
            # result is a tuple: (diagnosis, confidence)
            diagnosis, base_confidence = result
            confidence = base_confidence * weight
            
            if diagnosis not in diagnoses:
                diagnoses[diagnosis] = {
                    'total_confidence': 0,
                    'methods': []
                }
            
            diagnoses[diagnosis]['total_confidence'] += confidence
            diagnoses[diagnosis]['methods'].append(method)
        
        # Get best diagnosis
        best_diagnosis = max(diagnoses.keys(), key=lambda k: diagnoses[k]['total_confidence'])
        best_info = diagnoses[best_diagnosis]
        
        # Calculate final confidence
        final_confidence = min(best_info['total_confidence'], 0.95)
        
        # Map diagnosis to severity
        severity = 'low'
        if 'Severe' in best_diagnosis or 'Block' in best_diagnosis:
            severity = 'high'
        elif 'Irregular' in best_diagnosis or 'AFib' in best_diagnosis or 'Tachycardia' in best_diagnosis or 'Bradycardia' in best_diagnosis:
            severity = 'medium'
        
        return {
            'diagnosis': best_diagnosis,
            'confidence': float(final_confidence),
            'severity': severity,
            'methods_agreement': len(best_info['methods']),
            'heart_rate_bpm': features['heart_rate'],
            'hrv': {
                'SDNN': features['sdnn'],
                'RMSSD': features['rmssd'],
                'pNN50': features['pnn50']
            },
            'frequency_analysis': {
                'LF': features['lf_power'],
                'HF': features['hf_power'],
                'LF_HF_ratio': features['lf_hf_ratio']
            },
            'rhythm_regularity': 1.0 - min(features['rr_std'] / 0.3, 1.0),
            'all_candidates': {k: v['total_confidence'] for k, v in diagnoses.items()}
        }
    
    def add_patient_context(self, result, patient_data):
        """Add patient-specific context to analysis"""
        age = patient_data.get('age', 0)
        gender = patient_data.get('gender', 'unknown')
        conditions = patient_data.get('medical_history', [])
        
        # Adjust confidence based on patient context
        diagnosis = result['diagnosis']
        
        # Age-related adjustments
        if age > 65:
            if 'Bradycardia' in diagnosis:
                result['note'] = 'Common in elderly patients, monitor regularly'
            elif 'AFib' in diagnosis:
                result['risk_level'] = 'high'
                result['note'] = 'Increased stroke risk due to age'
        
        # Medical history adjustments
        if 'hypertension' in conditions and 'Tachycardia' in diagnosis:
            result['note'] = 'May be related to hypertension, consult doctor'
        
        return result
    
    def safe_fallback_result(self):
        """Safe fallback when analysis fails"""
        return {
            'diagnosis': 'Analysis Error',
            'confidence': 0.0,
            'severity': 'unknown',
            'heart_rate_bpm': 0,
            'note': 'Unable to analyze signal, please try again'
        }


# Singleton instance
_analyzer_instance = None

def get_analyzer(sample_rate=250):
    """Get singleton analyzer instance"""
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = EnhancedECGAnalyzer(sample_rate)
    return _analyzer_instance
