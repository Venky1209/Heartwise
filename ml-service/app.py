"""
HeartWise ML Analysis Service
Flask API for ECG classification using pre-trained models + AI Diet Recommendations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import logging
from datetime import datetime
import os
from dotenv import load_dotenv
import threading

# Load environment variables from .env file
load_dotenv()

# Set Google Gemini API key directly (embedded)
os.environ['GEMINI_API_KEY'] = "AIzaSyCOhi-mbRiu8cxB8EaljPFGlYN2KKC_yKM"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for models (will be loaded asynchronously)
analyzer = None
DL_MODEL_AVAILABLE = False
MODELS_LOADING = True

def load_models_async():
    """Load TensorFlow models asynchronously to avoid startup hang"""
    global analyzer, DL_MODEL_AVAILABLE, MODELS_LOADING
    
    try:
        logger.info("🔄 Loading ENHANCED ECG analysis models in background...")
        
        # Import and initialize ENHANCED ECG Analyzer (more powerful!)
        from enhanced_ecg_analyzer import get_analyzer
        analyzer = get_analyzer(sample_rate=250)
        logger.info("✓ Enhanced ECG Analyzer loaded - POWER MODE ACTIVATED 🚀")
        
        # Try to load deep learning model
        try:
            from dl_ecg_model import classifier as dl_classifier
            DL_MODEL_AVAILABLE = True
            logger.info("✓ Deep Learning model loaded")
        except Exception as e:
            logger.warning(f"⚠ Deep Learning model not available: {e}")
            logger.info("📊 Using Ensemble Classifier instead")
        
        MODELS_LOADING = False
        logger.info("✅ All ECG models loaded successfully!")
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        MODELS_LOADING = False

# Start loading models in background thread
threading.Thread(target=load_models_async, daemon=True).start()

logger.info("🚀 HeartWise ML Service Starting...")
logger.info("   ✓ ECG Analysis: Loading in background")
logger.info("   ✓ AI Diet Recommendations: Ready (Gemini AI)")
logger.info("   ✓ Deep Learning: Loading in background")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'HeartWise ML Analysis',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': analyzer is not None,
        'models_loading': MODELS_LOADING,
        'deep_learning_available': DL_MODEL_AVAILABLE,
        'gemini_ai_available': True,
        'mode': 'full-service'
    })

@app.route('/analyze', methods=['POST'])
def analyze_ecg():
    """
    Analyze ECG data and return classification results
    """
    global analyzer, MODELS_LOADING
    
    # Check if models are still loading
    if MODELS_LOADING:
        return jsonify({
            'error': 'Models are still loading',
            'message': 'Please wait a few seconds and try again',
            'status': 'loading'
        }), 503
    
    # Check if analyzer is ready
    if analyzer is None:
        return jsonify({
            'error': 'ECG analyzer not initialized',
            'message': 'Models failed to load. Check server logs.'
        }), 503
    
    try:
        data = request.json
        ecg_data = data.get('ecg_data', [])
        
        if not ecg_data or len(ecg_data) == 0:
            return jsonify({'error': 'No ECG data provided'}), 400
        
        # Get pre-calculated metrics from backend if available (more accurate)
        precalculated_metrics = {
            'heart_rate': data.get('heart_rate'),
            'qrs_count': data.get('qrs_count'),
            'hrv': data.get('hrv')
        }
        
        logger.info(f"🔍 Precalculated metrics: HR={precalculated_metrics.get('heart_rate')}, QRS={precalculated_metrics.get('qrs_count')}, HRV={precalculated_metrics.get('hrv')}")
        
        # Analyze using ensemble classifier
        results = analyzer.analyze(ecg_data, precalculated_metrics=precalculated_metrics)
        
        logger.info(f"📊 Analysis complete: {results.get('diagnosis')} (confidence: {results.get('confidence')}), HRV returned: {results.get('hrv')}")
        
        # Add deep learning predictions if available
        if DL_MODEL_AVAILABLE:
            try:
                from dl_ecg_model import classifier as dl_classifier
                dl_results = dl_classifier.predict(ecg_data)
                results['deep_learning'] = dl_results
            except Exception as e:
                logger.warning(f"DL prediction failed: {e}")
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Error analyzing ECG: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/batch-analyze', methods=['POST'])
def batch_analyze():
    """
    Batch analyze multiple ECG segments
    """
    global analyzer, MODELS_LOADING
    
    if MODELS_LOADING:
        return jsonify({
            'error': 'Models are still loading',
            'status': 'loading'
        }), 503
    
    if analyzer is None:
        return jsonify({'error': 'ECG analyzer not initialized'}), 503
    
    try:
        data = request.json
        segments = data.get('segments', [])
        
        if not segments:
            return jsonify({'error': 'No segments provided'}), 400
        
        results = []
        for segment in segments:
            result = analyzer.analyze(segment)
            results.append(result)
        
        return jsonify({'results': results})
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def get_models():
    """Get information about loaded models"""
    return jsonify({
        'dl_model_available': DL_MODEL_AVAILABLE,
        'ensemble_available': analyzer is not None,
        'diet_ai_available': True,
        'models_loading': MODELS_LOADING,
        'message': 'Full service with ECG analysis and AI diet recommendations'
    })


@app.route('/diet/recommend', methods=['POST'])
def generate_diet_recommendations():
    """
    Generate AI-powered diet recommendations
    
    Expected JSON body:
    {
        "profile": {...},
        "medical_history": {...},
        "medications": [...],
        "ecg_timeline": [...]
    }
    """
    try:
        from diet_recommender import DietRecommender
        
        data = request.json
        recommender = DietRecommender()
        
        recommendations = recommender.generate_recommendations(
            profile=data.get('profile', {}),
            medical_history=data.get('medical_history', {}),
            medications=data.get('medications', []),
            ecg_timeline=data.get('ecg_timeline', []),
            health_summary=data.get('health_summary')
        )
        
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Error generating diet recommendations: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    logger.info("Starting HeartWise ML Analysis Service on port 5002")
    app.run(host='0.0.0.0', port=5002, debug=False)
