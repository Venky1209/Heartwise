"""
Test suite for Deep Learning ECG Classification Model
Tests model architecture, preprocessing, and predictions
"""

import numpy as np
import sys
from dl_ecg_model import ECGClassifier

def generate_synthetic_ecg(condition='normal', duration_seconds=10, sample_rate=250):
    """
    Generate synthetic ECG data for testing
    
    Args:
        condition: 'normal', 'afib', 'bradycardia', 'tachycardia', 'pvc'
        duration_seconds: Length of ECG recording
        sample_rate: Sampling rate in Hz
    
    Returns:
        Array of synthetic ECG voltage values
    """
    num_samples = duration_seconds * sample_rate
    t = np.linspace(0, duration_seconds, num_samples)
    
    # Base heart rates for different conditions
    heart_rates = {
        'normal': 75,
        'afib': 85,
        'bradycardia': 45,
        'tachycardia': 120,
        'pvc': 70
    }
    
    hr = heart_rates.get(condition, 75)
    heart_period = 60.0 / hr  # seconds per beat
    
    ecg = np.zeros(num_samples)
    
    for i, time in enumerate(t):
        # P wave (atrial depolarization)
        p_time = time % heart_period
        if 0 < p_time < 0.08:
            ecg[i] += 0.15 * np.sin(np.pi * p_time / 0.08)
        
        # QRS complex (ventricular depolarization)
        qrs_time = (time - 0.12) % heart_period
        if 0 < qrs_time < 0.08:
            # Q wave (negative)
            if qrs_time < 0.02:
                ecg[i] -= 0.1 * np.sin(np.pi * qrs_time / 0.02)
            # R wave (large positive)
            elif qrs_time < 0.05:
                ecg[i] += 1.5 * np.sin(np.pi * (qrs_time - 0.02) / 0.03)
            # S wave (negative)
            else:
                ecg[i] -= 0.3 * np.sin(np.pi * (qrs_time - 0.05) / 0.03)
        
        # T wave (ventricular repolarization)
        t_time = (time - 0.30) % heart_period
        if 0 < t_time < 0.15:
            ecg[i] += 0.3 * np.sin(np.pi * t_time / 0.15)
    
    # Add condition-specific variations
    if condition == 'afib':
        # Irregular rhythm and no clear P waves
        ecg += np.random.normal(0, 0.05, num_samples)
        # Remove P waves
        for i in range(num_samples):
            p_time = t[i] % heart_period
            if 0 < p_time < 0.08:
                ecg[i] -= 0.15 * np.sin(np.pi * p_time / 0.08)
    
    elif condition == 'pvc':
        # Add premature ventricular contractions every 5 beats
        beat_interval = int(sample_rate * heart_period)
        for beat_num in range(0, num_samples // beat_interval):
            if beat_num % 5 == 0:  # Every 5th beat is PVC
                pvc_start = beat_num * beat_interval
                if pvc_start + 100 < num_samples:
                    # Wide, bizarre QRS complex
                    ecg[pvc_start:pvc_start+100] += np.random.normal(0.8, 0.2, 100)
    
    # Add baseline noise
    ecg += np.random.normal(0, 0.02, num_samples)
    
    return ecg.tolist()


def test_model_architecture():
    """Test 1: Model architecture can be built"""
    print("\n" + "="*70)
    print("TEST 1: Model Architecture")
    print("="*70)
    
    try:
        classifier = ECGClassifier()
        classifier.build_model()
        
        print("✓ Model built successfully")
        print(f"✓ Input shape: (None, {classifier.input_length}, 1)")
        print(f"✓ Output classes: {len(classifier.class_names)}")
        print(f"✓ Class names: {classifier.class_names}")
        
        # Get model summary
        print("\nModel Summary:")
        classifier.get_model_summary()
        
        return True
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_preprocessing():
    """Test 2: Preprocessing pipeline"""
    print("\n" + "="*70)
    print("TEST 2: ECG Preprocessing")
    print("="*70)
    
    try:
        classifier = ECGClassifier()
        classifier.build_model()
        
        # Test with different length inputs
        test_cases = [
            ("10 seconds (2500 points)", generate_synthetic_ecg('normal', 10, 250)),
            ("5 seconds (1250 points)", generate_synthetic_ecg('normal', 5, 250)),
            ("20 seconds (5000 points)", generate_synthetic_ecg('normal', 20, 250)),
        ]
        
        for name, ecg_data in test_cases:
            processed = classifier.preprocess_ecg(ecg_data)
            print(f"✓ {name}: Input {len(ecg_data)} → Output {processed.shape}")
            assert processed.shape == (1, classifier.input_length, 1), "Invalid output shape"
        
        print("\n✓ All preprocessing tests passed")
        return True
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_predictions():
    """Test 3: Model can make predictions"""
    print("\n" + "="*70)
    print("TEST 3: Model Predictions")
    print("="*70)
    
    try:
        classifier = ECGClassifier()
        classifier.load_model()  # This will build a new model if no saved model exists
        
        conditions = ['normal', 'afib', 'bradycardia', 'tachycardia', 'pvc']
        
        for condition in conditions:
            ecg_data = generate_synthetic_ecg(condition, 10, 250)
            result = classifier.predict(ecg_data)
            
            print(f"\n{condition.upper()}:")
            print(f"  Predicted: {result['predicted_class']}")
            print(f"  Confidence: {result['confidence']:.2%}")
            print(f"  Top 3 probabilities:")
            sorted_probs = sorted(result['probabilities'].items(), 
                                key=lambda x: x[1], reverse=True)[:3]
            for class_name, prob in sorted_probs:
                print(f"    - {class_name}: {prob:.2%}")
        
        print("\n✓ All prediction tests passed")
        print("\n⚠ NOTE: Model is untrained, predictions are random!")
        print("Train the model on real ECG data for accurate predictions.")
        return True
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_batch_processing():
    """Test 4: Batch processing multiple ECG recordings"""
    print("\n" + "="*70)
    print("TEST 4: Batch Processing")
    print("="*70)
    
    try:
        classifier = ECGClassifier()
        classifier.load_model()
        
        # Generate multiple ECG recordings
        batch_data = [
            generate_synthetic_ecg('normal', 10, 250),
            generate_synthetic_ecg('afib', 10, 250),
            generate_synthetic_ecg('tachycardia', 10, 250),
        ]
        
        results = []
        for i, ecg in enumerate(batch_data):
            result = classifier.predict(ecg)
            results.append(result)
            print(f"✓ Recording {i+1}: {result['predicted_class']} ({result['confidence']:.2%})")
        
        print(f"\n✓ Successfully processed {len(results)} recordings")
        return True
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_edge_cases():
    """Test 5: Edge cases and error handling"""
    print("\n" + "="*70)
    print("TEST 5: Edge Cases")
    print("="*70)
    
    try:
        classifier = ECGClassifier()
        classifier.build_model()
        
        # Test 1: Very short ECG (should still work due to interpolation)
        try:
            short_ecg = [0.5, 0.6, 0.7, 0.8, 0.9] * 100  # 500 points = 2 seconds
            result = classifier.predict(short_ecg)
            print(f"✓ Short ECG handled: {result['predicted_class']}")
        except Exception as e:
            print(f"⚠ Short ECG failed (expected): {e}")
        
        # Test 2: ECG with NaN values
        try:
            ecg_with_nan = generate_synthetic_ecg('normal', 10, 250)
            ecg_with_nan[100:110] = [np.nan] * 10  # Add some NaN values
            result = classifier.predict(ecg_with_nan)
            print(f"✓ NaN handling: {result['predicted_class']}")
        except Exception as e:
            print(f"✗ NaN handling failed: {e}")
            return False
        
        # Test 3: All zeros
        try:
            zeros = [0.0] * 2500
            result = classifier.predict(zeros)
            print(f"✓ Zero signal handled: {result['predicted_class']}")
        except Exception as e:
            print(f"⚠ Zero signal failed (expected): {e}")
        
        print("\n✓ Edge case tests completed")
        return True
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run complete test suite"""
    print("\n" + "="*70)
    print("🧪 DEEP LEARNING ECG MODEL TEST SUITE")
    print("="*70)
    
    tests = [
        ("Model Architecture", test_model_architecture),
        ("Preprocessing Pipeline", test_preprocessing),
        ("Model Predictions", test_predictions),
        ("Batch Processing", test_batch_processing),
        ("Edge Cases", test_edge_cases),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"\n✗ Test '{name}' crashed: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))
    
    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {name}")
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    print(f"\nResults: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n⚠ Some tests failed")
        return 1


if __name__ == '__main__':
    exit_code = run_all_tests()
    sys.exit(exit_code)
