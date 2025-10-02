"""
HeartWise ML Analysis Service
Flask API for ECG classification using pre-trained models
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Import analysis modules
from ecg_analyzer import ECGAnalyzer

# Initialize analyzer
analyzer = ECGAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'HeartWise ML Analysis',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': analyzer.is_model_loaded()
    })

@app.route('/analyze', methods=['POST'])
def analyze_ecg():
    """
    Analyze ECG data using ML model
    
    Request body:
    {
        "sessionId": "uuid",
        "ecgData": [
            {"timestamp_ms": 1000, "voltage_mv": 0.5},
            ...
        ],
        "sampleRate": 250
    }
    
    Response:
    {
        "sessionId": "uuid",
        "classification": "Normal" | "Atrial Fibrillation" | "Arrhythmia",
        "confidence": 0.95,
        "details": {
            "heartRate": 75,
            "rhythm": "Regular",
            "abnormalities": []
        },
        "timestamp": "2025-10-02T..."
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'ecgData' not in data:
            return jsonify({'error': 'Missing ecgData in request'}), 400
        
        session_id = data.get('sessionId', 'unknown')
        ecg_data = data['ecgData']
        sample_rate = data.get('sampleRate', 250)
        
        logger.info(f"Analyzing ECG session {session_id} with {len(ecg_data)} data points")
        
        # Extract voltage values
        voltages = [point['voltage_mv'] for point in ecg_data]
        
        # Run analysis
        result = analyzer.analyze(voltages, sample_rate)
        result['sessionId'] = session_id
        result['timestamp'] = datetime.now().isoformat()
        
        logger.info(f"Analysis complete: {result['classification']} (confidence: {result['confidence']:.2f})")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error analyzing ECG: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/batch-analyze', methods=['POST'])
def batch_analyze():
    """
    Analyze multiple ECG segments
    
    Request body:
    {
        "sessions": [
            {"sessionId": "uuid1", "ecgData": [...], "sampleRate": 250},
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        sessions = data.get('sessions', [])
        
        results = []
        for session in sessions:
            voltages = [point['voltage_mv'] for point in session['ecgData']]
            result = analyzer.analyze(voltages, session.get('sampleRate', 250))
            result['sessionId'] = session.get('sessionId', 'unknown')
            results.append(result)
        
        return jsonify({
            'results': results,
            'count': len(results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def get_models():
    """Get information about loaded models"""
    return jsonify(analyzer.get_model_info())

if __name__ == '__main__':
    logger.info("Starting HeartWise ML Analysis Service on port 5002")
    app.run(host='0.0.0.0', port=5002, debug=True)
