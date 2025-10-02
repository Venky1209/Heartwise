const express = require('express');
const router = express.Router();
const Joi = require('joi');
const axios = require('axios');
const ecgAnalyzer = require('../utils/ecgAnalyzer');

// ML Service URL (force IPv4)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5002';

// Configure axios to prefer IPv4
axios.defaults.family = 4;

// Validation schema for analysis results
const analysisSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  analysisType: Joi.string().valid('rhythm', 'morphology', 'abnormality_detection', 'quality_assessment').required(),
  confidenceScore: Joi.number().min(0).max(1).optional(),
  predictions: Joi.object().optional(),
  abnormalitiesDetected: Joi.array().items(Joi.string()).optional(),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  recommendations: Joi.string().optional(),
  modelVersion: Joi.string().max(50).optional()
});

// Get all analysis results
router.get('/', async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    const analysisType = req.query.analysisType;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [limit, offset];
    let paramIndex = 3;

    if (sessionId) {
      whereClause += `WHERE ear.session_id = $${paramIndex}`;
      queryParams.push(sessionId);
      paramIndex++;
    }

    if (analysisType) {
      whereClause += sessionId ? ' AND ' : 'WHERE ';
      whereClause += `ear.analysis_type = $${paramIndex}`;
      queryParams.push(analysisType);
    }

    const query = `
      SELECT ear.*, 
        es.session_name, es.start_time,
        p.first_name, p.last_name
      FROM ecg_analysis_results ear
      JOIN ecg_sessions es ON ear.session_id = es.id
      JOIN patients p ON es.patient_id = p.id
      ${whereClause}
      ORDER BY ear.processed_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await req.app.locals.db.query(query, queryParams);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    res.status(500).json({ error: 'Failed to fetch analysis results' });
  }
});

// Get analysis result by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT ear.*, 
        es.session_name, es.start_time, es.duration_seconds,
        p.first_name, p.last_name, p.date_of_birth, p.gender
      FROM ecg_analysis_results ear
      JOIN ecg_sessions es ON ear.session_id = es.id
      JOIN patients p ON es.patient_id = p.id
      WHERE ear.id = $1
    `;
    
    const result = await req.app.locals.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis result not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching analysis result:', error);
    res.status(500).json({ error: 'Failed to fetch analysis result' });
  }
});

// Create new analysis result
router.post('/', async (req, res) => {
  try {
    const { error, value } = analysisSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message)
      });
    }

    const { 
      sessionId, 
      analysisType, 
      confidenceScore, 
      predictions, 
      abnormalitiesDetected, 
      riskLevel, 
      recommendations, 
      modelVersion 
    } = value;

    // Verify session exists
    const sessionCheck = await req.app.locals.db.query(
      'SELECT id FROM ecg_sessions WHERE id = $1', [sessionId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const query = `
      INSERT INTO ecg_analysis_results (
        session_id, analysis_type, confidence_score, predictions, 
        abnormalities_detected, risk_level, recommendations, model_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await req.app.locals.db.query(query, [
      sessionId, 
      analysisType, 
      confidenceScore, 
      JSON.stringify(predictions), 
      JSON.stringify(abnormalitiesDetected), 
      riskLevel, 
      recommendations, 
      modelVersion
    ]);
    
    res.status(201).json({
      message: 'Analysis result created successfully',
      analysis: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating analysis result:', error);
    res.status(500).json({ error: 'Failed to create analysis result' });
  }
});

// Run basic ECG analysis (placeholder for AI integration)
router.post('/run/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { analysisType = 'quality_assessment' } = req.body;

    // Verify session exists and has data
    const sessionQuery = `
      SELECT es.*, COUNT(edp.id) as data_points_count
      FROM ecg_sessions es
      LEFT JOIN ecg_data_points edp ON es.id = edp.session_id
      WHERE es.id = $1
      GROUP BY es.id
    `;
    
    const sessionResult = await req.app.locals.db.query(sessionQuery, [sessionId]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];
    
    if (session.data_points_count === '0') {
      return res.status(400).json({ error: 'No ECG data found for analysis' });
    }

    // Run basic analysis based on type
    let analysisResult;
    
    switch (analysisType) {
      case 'quality_assessment':
        analysisResult = await runQualityAssessment(req.app.locals.db, sessionId);
        break;
      case 'rhythm':
        analysisResult = await runRhythmAnalysis(req.app.locals.db, sessionId);
        break;
      case 'abnormality_detection':
        analysisResult = await runAbnormalityDetection(req.app.locals.db, sessionId);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported analysis type' });
    }

    // Save analysis result
    const insertQuery = `
      INSERT INTO ecg_analysis_results (
        session_id, analysis_type, confidence_score, predictions, 
        abnormalities_detected, risk_level, recommendations, model_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await req.app.locals.db.query(insertQuery, [
      sessionId,
      analysisType,
      analysisResult.confidenceScore,
      JSON.stringify(analysisResult.predictions),
      JSON.stringify(analysisResult.abnormalities),
      analysisResult.riskLevel,
      analysisResult.recommendations,
      'basic-v1.0'
    ]);
    
    res.json({
      message: 'Analysis completed successfully',
      analysis: result.rows[0]
    });
  } catch (error) {
    console.error('Error running analysis:', error);
    res.status(500).json({ error: 'Failed to run analysis' });
  }
});

// Basic quality assessment function
async function runQualityAssessment(db, sessionId) {
  const query = `
    SELECT 
      COUNT(*) as total_points,
      AVG(voltage_mv) as avg_voltage,
      STDDEV(voltage_mv) as voltage_stddev,
      COUNT(CASE WHEN is_artifact = true THEN 1 END) as artifact_count,
      AVG(quality_score) as avg_quality,
      MIN(voltage_mv) as min_voltage,
      MAX(voltage_mv) as max_voltage
    FROM ecg_data_points
    WHERE session_id = $1
  `;
  
  const result = await db.query(query, [sessionId]);
  const stats = result.rows[0];
  
  // Basic quality scoring
  const artifactRatio = parseFloat(stats.artifact_count) / parseFloat(stats.total_points);
  const voltageRange = stats.max_voltage - stats.min_voltage;
  
  let qualityScore = 1.0;
  let riskLevel = 'low';
  let recommendations = [];

  // Penalize high artifact ratio
  if (artifactRatio > 0.1) {
    qualityScore -= 0.3;
    recommendations.push('High noise detected - check electrode placement');
  }

  // Check voltage range (typical ECG should be 0.5-4mV)
  if (voltageRange < 0.5) {
    qualityScore -= 0.2;
    recommendations.push('Low signal amplitude - check electrode contact');
  } else if (voltageRange > 10) {
    qualityScore -= 0.3;
    recommendations.push('High signal amplitude - possible electrode noise');
  }

  // Determine risk level based on quality
  if (qualityScore < 0.5) {
    riskLevel = 'high';
  } else if (qualityScore < 0.7) {
    riskLevel = 'medium';
  }

  return {
    confidenceScore: Math.max(0, qualityScore),
    predictions: {
      signalQuality: qualityScore > 0.7 ? 'good' : qualityScore > 0.5 ? 'fair' : 'poor',
      artifactRatio: artifactRatio.toFixed(3),
      voltageRange: voltageRange.toFixed(3),
      totalDataPoints: stats.total_points
    },
    abnormalities: qualityScore < 0.7 ? ['poor_signal_quality'] : [],
    riskLevel,
    recommendations: recommendations.join('; ') || 'Signal quality is acceptable'
  };
}

// Basic rhythm analysis function
async function runRhythmAnalysis(db, sessionId) {
  // This is a placeholder for basic rhythm analysis
  // In a real implementation, this would use signal processing algorithms
  
  const query = `
    SELECT voltage_mv, timestamp_ms
    FROM ecg_data_points
    WHERE session_id = $1 AND is_artifact = false
    ORDER BY timestamp_ms ASC
    LIMIT 5000
  `;
  
  const result = await db.query(query, [sessionId]);
  const dataPoints = result.rows;
  
  // Very basic heart rate estimation (placeholder)
  // This would normally use peak detection algorithms
  let estimatedHeartRate = 75; // Default normal heart rate
  let rhythm = 'regular';
  let abnormalities = [];
  let riskLevel = 'low';

  if (dataPoints.length < 100) {
    return {
      confidenceScore: 0.3,
      predictions: { heartRate: 'insufficient_data', rhythm: 'unknown' },
      abnormalities: ['insufficient_data'],
      riskLevel: 'medium',
      recommendations: 'Insufficient data for rhythm analysis'
    };
  }

  // Placeholder rhythm analysis
  const avgVoltage = dataPoints.reduce((sum, dp) => sum + dp.voltage_mv, 0) / dataPoints.length;
  
  if (avgVoltage < 0.5) {
    abnormalities.push('low_amplitude');
    riskLevel = 'medium';
  }

  return {
    confidenceScore: 0.8,
    predictions: {
      heartRate: estimatedHeartRate,
      rhythm: rhythm,
      avgAmplitude: avgVoltage.toFixed(3)
    },
    abnormalities,
    riskLevel,
    recommendations: abnormalities.length > 0 ? 
      'Abnormalities detected - consult with healthcare provider' : 
      'Rhythm analysis appears normal'
  };
}

// Basic abnormality detection function
async function runAbnormalityDetection(db, sessionId) {
  // Placeholder for abnormality detection
  // Real implementation would use trained ML models
  
  return {
    confidenceScore: 0.6,
    predictions: {
      arrhythmia: 'none_detected',
      morphology: 'normal_variants',
      signalQuality: 'acceptable'
    },
    abnormalities: [],
    riskLevel: 'low',
    recommendations: 'No significant abnormalities detected in basic analysis. For comprehensive analysis, consider professional ECG interpretation.'
  };
}

// Get analysis summary for a patient
router.get('/patient/:patientId/summary', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const query = `
      SELECT 
        ear.analysis_type,
        COUNT(*) as analysis_count,
        AVG(ear.confidence_score) as avg_confidence,
        MAX(ear.processed_at) as latest_analysis,
        SUM(CASE WHEN ear.risk_level = 'high' THEN 1 ELSE 0 END) as high_risk_count,
        SUM(CASE WHEN ear.risk_level = 'critical' THEN 1 ELSE 0 END) as critical_count
      FROM ecg_analysis_results ear
      JOIN ecg_sessions es ON ear.session_id = es.id
      WHERE es.patient_id = $1
      GROUP BY ear.analysis_type
      ORDER BY ear.analysis_type
    `;
    
    const result = await req.app.locals.db.query(query, [patientId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient analysis summary:', error);
    res.status(500).json({ error: 'Failed to fetch patient analysis summary' });
  }
});

// NEW: Hybrid ECG Analysis Endpoint (Rule-Based + ML)
router.post('/hybrid/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`Starting hybrid analysis for session: ${sessionId}`);

    // Step 1: Fetch ECG data from database
    const ecgDataQuery = `
      SELECT timestamp_ms, voltage_mv, created_at
      FROM ecg_data_points
      WHERE session_id = $1
      ORDER BY timestamp_ms ASC
      LIMIT 50000
    `;
    
    const ecgDataResult = await req.app.locals.db.query(ecgDataQuery, [sessionId]);
    
    if (ecgDataResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No ECG data found for this session',
        sessionId 
      });
    }

    console.log(`Fetched ${ecgDataResult.rows.length} ECG data points`);

    // Step 2: Run Rule-Based Analysis (Pan-Tompkins)
    const ruleBasedAnalysis = ecgAnalyzer.analyzeSession(ecgDataResult.rows);
    
    console.log('Rule-based analysis completed:', {
      heartRate: ruleBasedAnalysis.metrics?.heartRate,
      arrhythmias: ruleBasedAnalysis.arrhythmias?.length
    });

    // Step 3: Prepare data for ML Service (Enhanced AI Analysis)
    const ecgData = ecgDataResult.rows.map(row => ({
      timestamp_ms: row.timestamp_ms,
      voltage_mv: row.voltage_mv || 0
    }));

    // Step 4: Call ML Service for Advanced AI-Powered Analysis
    let mlAnalysis = null;
    try {
      console.log('Calling ML service for AI diagnosis...');
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, {
        sessionId: sessionId,
        ecgData: ecgData,
        sampleRate: 250
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        },
        family: 4 // Force IPv4 to avoid ::1 (IPv6) connection issues
      });
      
      mlAnalysis = mlResponse.data;
      console.log('✓ AI Analysis completed:', {
        classification: mlAnalysis.classification,
        confidence: mlAnalysis.confidence,
        riskLevel: mlAnalysis.risk_level,
        heartRate: mlAnalysis.details?.heartRate
      });
    } catch (mlError) {
      console.warn('⚠ ML service unavailable, using rule-based only:', mlError.message);
      mlAnalysis = {
        classification: 'Unknown',
        confidence: 0,
        risk_level: 'unknown',
        details: {
          heartRate: 0,
          rhythm: 'Unknown',
          abnormalities: [{
            type: 'ML Service Unavailable',
            severity: 'Info',
            description: 'Using rule-based analysis only',
            recommendation: 'ML service is not running on port 5002'
          }]
        },
        message: 'ML service unavailable - ensure Python ML service is running on port 5002'
      };
    }

    // Step 5: Combine Results (Enhanced with AI)
    const combinedAnalysis = {
      sessionId,
      timestamp: new Date().toISOString(),
      analysisType: 'hybrid_ai_ml',
      
      // AI/ML Classification (Primary)
      aiDiagnosis: {
        classification: mlAnalysis.classification || 'Unknown',
        confidence: mlAnalysis.confidence || 0,
        riskLevel: mlAnalysis.riskLevel || mlAnalysis.risk_level || 'unknown',
        heartRate: mlAnalysis.details?.heartRate || mlAnalysis.heartRate || ruleBasedAnalysis.metrics?.heartRate || 0,
        rhythm: mlAnalysis.details?.rhythm || 'Unknown',
        qrsCount: mlAnalysis.details?.qrsCount || ruleBasedAnalysis.metrics?.rPeakCount || 0,
        hrv: mlAnalysis.details?.hrv || ruleBasedAnalysis.metrics?.hrv || {},
        signalQuality: mlAnalysis.details?.signalQuality || ruleBasedAnalysis.metrics?.signalQuality || {},
        abnormalities: mlAnalysis.details?.abnormalities || [],
        recommendations: mlAnalysis.recommendations || []
      },
      
      // Alias for frontend compatibility
      mlClassification: {
        classification: mlAnalysis.classification || 'Unknown',
        diagnosis: mlAnalysis.classification || 'Unknown',
        confidence: mlAnalysis.confidence || 0
      },
      
      // Rule-based metrics (Secondary/Backup) 
      basicMetrics: {
        heartRate: mlAnalysis.details?.heartRate || mlAnalysis.heartRate || ruleBasedAnalysis.metrics?.heartRate || 0,
        rPeakCount: mlAnalysis.details?.qrsCount || ruleBasedAnalysis.metrics?.rPeakCount || 0,
        avgRRInterval: ruleBasedAnalysis.metrics?.avgRRInterval || 0,
        hrv: mlAnalysis.details?.hrv || ruleBasedAnalysis.metrics?.hrv || {},
        signalQuality: mlAnalysis.details?.signalQuality || ruleBasedAnalysis.metrics?.signalQuality || {}
      },
      
      // Rule-based arrhythmia detection (Backup)
      ruleBasedArrhythmias: ruleBasedAnalysis.arrhythmias || [],
      
      // Overall assessment (use AI if available, fallback to rule-based)
      overallRisk: mlAnalysis.riskLevel || mlAnalysis.risk_level || determineOverallRisk(
        ruleBasedAnalysis.arrhythmias,
        mlAnalysis.classification
      ),
      
      // Combined recommendations
      recommendations: mlAnalysis.recommendations || generateRecommendations(
        ruleBasedAnalysis.arrhythmias,
        mlAnalysis.classification,
        ruleBasedAnalysis.metrics
      ),
      
      // Data statistics
      dataStats: {
        totalPoints: ecgDataResult.rows.length,
        duration: ecgDataResult.rows.length / 250, // seconds
        samplingRate: 250
      },
      
      // Analysis metadata
      metadata: {
        mlServiceAvailable: mlAnalysis.classification !== 'Unknown',
        analysisEngine: mlAnalysis.analysis_type || 'hybrid',
        modelVersion: 'v1.0-ai-enhanced'
      }
    };

    // Step 6: Save analysis results to database
    try {
      const saveQuery = `
        INSERT INTO ecg_analysis_results (
          session_id, 
          analysis_type, 
          confidence_score, 
          predictions, 
          abnormalities_detected, 
          risk_level, 
          recommendations,
          model_version
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      
      await req.app.locals.db.query(saveQuery, [
        sessionId,
        'hybrid_ai_ml',
        mlAnalysis.confidence || 0.5,
        JSON.stringify(combinedAnalysis.aiDiagnosis),
        JSON.stringify(combinedAnalysis.aiDiagnosis.abnormalities),
        // Map risk level to database allowed values (low, medium, high, critical)
        (combinedAnalysis.overallRisk || 'unknown').toLowerCase().replace('unknown', 'low'),
        Array.isArray(combinedAnalysis.recommendations) 
          ? combinedAnalysis.recommendations.join('; ')
          : combinedAnalysis.recommendations || 'No recommendations available',
        'v1.0-ai-enhanced'
      ]);
      
      console.log('Analysis results saved to database');
    } catch (saveError) {
      console.error('Error saving analysis to database:', saveError);
      // Continue even if save fails
    }

    // Step 7: Return combined results
    console.log('📊 Sending analysis response to frontend:', JSON.stringify({
      heartRate: combinedAnalysis.basicMetrics?.heartRate,
      mlClassification: combinedAnalysis.mlClassification,
      aiDiagnosis: combinedAnalysis.aiDiagnosis,
      overallRisk: combinedAnalysis.overallRisk
    }, null, 2));
    
    res.json({
      success: true,
      analysis: combinedAnalysis
    });

  } catch (error) {
    console.error('Error in hybrid analysis:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message,
      details: error.stack
    });
  }
});

// Helper: Determine overall risk level
function determineOverallRisk(arrhythmias, mlClassification) {
  // Check for high-severity arrhythmias
  const highSeverityArrhythmias = arrhythmias.filter(a => a.severity === 'high');
  if (highSeverityArrhythmias.length > 0) return 'high';
  
  // Check ML classification
  if (mlClassification && mlClassification.toLowerCase().includes('abnormal')) return 'medium';
  if (mlClassification && mlClassification.toLowerCase().includes('arrhythmia')) return 'medium';
  
  // Check for medium severity
  const mediumSeverityArrhythmias = arrhythmias.filter(a => a.severity === 'medium');
  if (mediumSeverityArrhythmias.length > 0) return 'medium';
  
  // Low risk
  return 'low';
}

// Helper: Generate recommendations
function generateRecommendations(arrhythmias, mlClassification, metrics) {
  const recommendations = [];
  
  // Based on arrhythmias
  if (arrhythmias.length === 0) {
    recommendations.push('No significant arrhythmias detected. Continue regular monitoring.');
  } else {
    arrhythmias.forEach(arr => {
      if (arr.type === 'Tachycardia') {
        recommendations.push('Elevated heart rate detected. Consider stress management and consult with a cardiologist.');
      } else if (arr.type === 'Bradycardia') {
        recommendations.push('Low heart rate detected. Monitor for symptoms of fatigue or dizziness.');
      } else if (arr.type === 'Possible Atrial Fibrillation') {
        recommendations.push('Irregular rhythm detected. Immediate consultation with a cardiologist is recommended.');
      }
    });
  }
  
  // Based on signal quality
  if (metrics && metrics.signalQuality && metrics.signalQuality.score < 60) {
    recommendations.push('Signal quality was suboptimal. Consider retaking ECG with better electrode contact.');
  }
  
  // Based on ML classification
  if (mlClassification && mlClassification.toLowerCase() !== 'normal') {
    recommendations.push('ML analysis suggests potential abnormality. Professional ECG interpretation recommended.');
  }
  
  // General recommendations
  recommendations.push('This is an automated analysis. Always consult with a healthcare professional for medical decisions.');
  
  return recommendations;
}

module.exports = router;