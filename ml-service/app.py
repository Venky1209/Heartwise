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
        'risk_scoring_available': True,
        'models_loading': MODELS_LOADING,
        'message': 'Full service with ECG analysis, AI diet recommendations, and risk scoring'
    })


@app.route('/risk/calculate', methods=['POST'])
def calculate_risk_score():
    """
    Calculate cardiac risk score
    
    Expected JSON body:
    {
        "demographics": {
            "age": 58,
            "gender": "male",
            "ethnicity": "caucasian"
        },
        "ecg_metrics": {
            "resting_hr": 85,
            "hrv_sdnn": 35,
            "arrhythmia_episodes_30days": 8,
            "pvc_count_24h": 450,
            "afib_detected": false
        },
        "lifestyle": {
            "smoking_status": "never",
            "exercise_minutes_per_week": 150,
            "bmi": 26.5,
            "alcohol_drinks_per_week": 3,
            "diet_quality_score": 65
        },
        "medical_history": {
            "hypertension": true,
            "bp_controlled": true,
            "diabetes": false,
            "ldl_cholesterol": 120,
            "previous_heart_attack": false,
            "family_history_heart_disease": true
        }
    }
    """
    try:
        from risk_scorer import calculate_user_risk
        
        user_data = request.json
        
        if not user_data:
            return jsonify({'error': 'No data provided'}), 400
        
        logger.info(f"Calculating risk score for user data")
        
        # Calculate risk score
        risk_assessment = calculate_user_risk(user_data)
        
        logger.info(f"Risk score calculated: {risk_assessment['overall_score']}/100 ({risk_assessment['risk_level']})")
        
        return jsonify(risk_assessment)
        
    except Exception as e:
        logger.error(f"Error calculating risk score: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


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


@app.route('/api/ml/chat/context', methods=['POST'])
def get_chat_context():
    """
    Get RAG context for chatbot query
    
    Expected JSON body:
    {
        "query": "user question",
        "user_id": 123
    }
    """
    try:
        from rag_service import get_rag_service
        
        data = request.json
        query = data.get('query', '')
        user_id = data.get('user_id')
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        # Get RAG service
        rag = get_rag_service()
        
        # Get augmented context
        context = rag.get_augmented_context(query, user_id=str(user_id) if user_id else None)
        
        # Get search results for debugging
        results = rag.search_context(query, n_results=5)
        
        return jsonify({
            'context': context,
            'results': results,
            'stats': rag.get_stats()
        })
        
    except Exception as e:
        logger.error(f"Error getting chat context: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/rag/add_ecg', methods=['POST'])
def add_ecg_to_rag():
    """
    Add ECG analysis to RAG knowledge base
    
    Expected JSON body:
    {
        "session_id": "uuid",
        "analysis_data": {...}
    }
    """
    try:
        from rag_service import get_rag_service
        
        data = request.json
        session_id = data.get('session_id')
        analysis_data = data.get('analysis_data')
        
        if not session_id or not analysis_data:
            return jsonify({'error': 'session_id and analysis_data are required'}), 400
        
        # Get RAG service
        rag = get_rag_service()
        
        # Add to knowledge base
        rag.add_ecg_analysis(session_id, analysis_data)
        
        return jsonify({
            'success': True,
            'message': f'ECG analysis {session_id} added to knowledge base',
            'stats': rag.get_stats()
        })
        
    except Exception as e:
        logger.error(f"Error adding ECG to RAG: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/rag/add_patient', methods=['POST'])
def add_patient_to_rag():
    """
    Add patient context to RAG knowledge base
    
    Expected JSON body:
    {
        "user_id": "123",
        "context": {...}
    }
    """
    try:
        from rag_service import get_rag_service
        
        data = request.json
        user_id = data.get('user_id')
        context = data.get('context')
        
        if not user_id or not context:
            return jsonify({'error': 'user_id and context are required'}), 400
        
        # Get RAG service
        rag = get_rag_service()
        
        # Add to knowledge base
        rag.add_patient_context(str(user_id), context)
        
        return jsonify({
            'success': True,
            'message': f'Patient context for {user_id} added to knowledge base',
            'stats': rag.get_stats()
        })
        
    except Exception as e:
        logger.error(f"Error adding patient to RAG: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/rag/stats', methods=['GET'])
def get_rag_stats():
    """Get RAG knowledge base statistics"""
    try:
        from rag_service import get_rag_service
        
        rag = get_rag_service()
        stats = rag.get_stats()
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error getting RAG stats: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    logger.info("Starting HeartWise ML Analysis Service on port 5002")
    app.run(host='0.0.0.0', port=5002, debug=False)
