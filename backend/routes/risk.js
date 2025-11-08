const express = require('express');
const router = express.Router();
const axios = require('axios');

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5002';

/**
 * Calculate risk score for a user
 * POST /api/risk/calculate
 */
router.post('/calculate', async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    
    // Fetch user data from database
    const userData = await gatherUserHealthData(req.app.locals.db, userId);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Call ML service to calculate risk
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/risk/calculate`, userData, {
      timeout: 10000
    });
    
    const riskAssessment = mlResponse.data;
    
    // Get previous score for comparison
    const previousScoreResult = await req.app.locals.db.query(
      'SELECT overall_score FROM risk_scores WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT 1',
      [userId]
    );
    
    const previousScore = previousScoreResult.rows.length > 0 ? previousScoreResult.rows[0].overall_score : null;
    const scoreChange = previousScore !== null ? riskAssessment.overall_score - previousScore : 0;
    
    // Save risk score to database
    const insertResult = await req.app.locals.db.query(`
      INSERT INTO risk_scores (
        user_id,
        overall_score,
        risk_level,
        ecg_risk_score,
        lifestyle_risk_score,
        medical_history_risk_score,
        demographic_risk_score,
        risk_30_days,
        risk_90_days,
        risk_1_year,
        high_risk_factors,
        moderate_risk_factors,
        protective_factors,
        metrics_snapshot,
        recommendations,
        model_version,
        confidence_score,
        previous_score,
        score_change,
        valid_until
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        NOW() + INTERVAL '30 days'
      ) RETURNING *
    `, [
      userId,
      riskAssessment.overall_score,
      riskAssessment.risk_level,
      riskAssessment.ecg_risk_score,
      riskAssessment.lifestyle_risk_score,
      riskAssessment.medical_history_risk_score,
      riskAssessment.demographic_risk_score,
      riskAssessment.risk_30_days,
      riskAssessment.risk_90_days,
      riskAssessment.risk_1_year,
      JSON.stringify(riskAssessment.high_risk_factors),
      JSON.stringify(riskAssessment.moderate_risk_factors),
      JSON.stringify(riskAssessment.protective_factors),
      JSON.stringify(userData),
      JSON.stringify(riskAssessment.recommendations),
      riskAssessment.model_version,
      riskAssessment.confidence_score,
      previousScore,
      scoreChange
    ]);
    
    const savedRiskScore = insertResult.rows[0];
    
    // Update user's last risk assessment date
    await req.app.locals.db.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      risk_score: savedRiskScore,
      change_from_previous: scoreChange
    });
    
  } catch (error) {
    console.error('Error calculating risk score:', error);
    res.status(500).json({ 
      error: 'Failed to calculate risk score',
      details: error.message 
    });
  }
});

/**
 * Get latest risk score for authenticated user
 * GET /api/risk/latest
 */
router.get('/latest', async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await req.app.locals.db.query(`
      SELECT * FROM risk_scores
      WHERE user_id = $1
      ORDER BY calculated_at DESC
      LIMIT 1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No risk assessment found',
        message: 'Calculate your first risk score'
      });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error fetching latest risk score:', error);
    res.status(500).json({ error: 'Failed to fetch risk score' });
  }
});

/**
 * Get risk score history
 * GET /api/risk/history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 30;
    const days = parseInt(req.query.days) || 90;
    
    const result = await req.app.locals.db.query(`
      SELECT 
        id,
        overall_score,
        risk_level,
        ecg_risk_score,
        lifestyle_risk_score,
        medical_history_risk_score,
        demographic_risk_score,
        calculated_at,
        score_change
      FROM risk_scores
      WHERE user_id = $1
      AND calculated_at >= NOW() - INTERVAL '1 day' * $2
      ORDER BY calculated_at DESC
      LIMIT $3
    `, [userId, days, limit]);
    
    // Calculate trend
    const trendResult = await req.app.locals.db.query(
      `SELECT calculate_risk_trend($1, 30) as trend`,
      [userId]
    );
    
    const trend = trendResult.rows[0]?.trend || 'insufficient_data';
    
    res.json({
      history: result.rows,
      trend: trend,
      total_assessments: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching risk score history:', error);
    res.status(500).json({ error: 'Failed to fetch risk score history' });
  }
});

/**
 * Get risk factors for authenticated user
 * GET /api/risk/factors
 */
router.get('/factors', async (req, res) => {
  try {
    const userId = req.userId;
    const status = req.query.status || 'active';
    
    const result = await req.app.locals.db.query(`
      SELECT * FROM risk_factors
      WHERE user_id = $1
      AND status = $2
      ORDER BY severity DESC, risk_contribution DESC
    `, [userId, status]);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching risk factors:', error);
    res.status(500).json({ error: 'Failed to fetch risk factors' });
  }
});

/**
 * Get risk alerts for authenticated user
 * GET /api/risk/alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.userId;
    const status = req.query.status; // Optional filter
    const limit = parseInt(req.query.limit) || 20;
    
    let query = 'SELECT * FROM risk_alerts WHERE user_id = $1';
    const params = [userId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await req.app.locals.db.query(query, params);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching risk alerts:', error);
    res.status(500).json({ error: 'Failed to fetch risk alerts' });
  }
});

/**
 * Mark alert as read/acknowledged
 * PUT /api/risk/alerts/:alertId
 */
router.put('/alerts/:alertId', async (req, res) => {
  try {
    const userId = req.userId;
    const { alertId } = req.params;
    const { status } = req.body;
    
    if (!['read', 'acknowledged', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const timestampField = status === 'read' ? 'read_at' : 'acknowledged_at';
    
    const result = await req.app.locals.db.query(`
      UPDATE risk_alerts
      SET status = $1, ${timestampField} = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `, [status, alertId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

/**
 * Get risk dashboard summary
 * GET /api/risk/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await req.app.locals.db.query(`
      SELECT * FROM v_user_risk_dashboard
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({
        message: 'No risk assessment yet',
        has_assessment: false
      });
    }
    
    res.json({
      ...result.rows[0],
      has_assessment: true
    });
    
  } catch (error) {
    console.error('Error fetching risk dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch risk dashboard' });
  }
});

/**
 * Helper function to gather user health data
 */
async function gatherUserHealthData(db, userId) {
  try {
    // Get user profile and demographics
    const userResult = await db.query(`
      SELECT 
        u.id,
        u.email,
        up.first_name,
        up.last_name,
        up.date_of_birth,
        up.gender,
        up.height_cm,
        up.weight_kg
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return null;
    }
    
    const user = userResult.rows[0];
    
    // Calculate age and BMI
    const age = user.date_of_birth ? 
      Math.floor((new Date() - new Date(user.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
      null;
    
    const bmi = user.height_cm && user.weight_kg ?
      (user.weight_kg / Math.pow(user.height_cm / 100, 2)).toFixed(1) :
      null;
    
    // Get ECG metrics (from recent sessions)
    const ecgResult = await db.query(`
      SELECT 
        AVG(heart_rate) as avg_heart_rate,
        COUNT(*) as session_count
      FROM ecg_sessions
      WHERE user_id = $1
      AND start_time >= NOW() - INTERVAL '30 days'
    `, [userId]);
    
    // Get recent analysis results
    const analysisResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN risk_level IN ('high', 'critical') THEN 1 END) as high_risk_count,
        COUNT(*) as total_analyses
      FROM ecg_analysis_results ear
      JOIN ecg_sessions es ON ear.session_id = es.id
      WHERE es.user_id = $1
      AND ear.processed_at >= NOW() - INTERVAL '30 days'
    `, [userId]);
    
    // Get medical history
    const medHistResult = await db.query(`
      SELECT * FROM medical_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);
    
    const medHist = medHistResult.rows[0] || {};
    
    // Compile data for ML service
    return {
      demographics: {
        age: age,
        gender: user.gender || 'unknown',
        ethnicity: medHist.ethnicity || 'unknown'
      },
      ecg_metrics: {
        resting_hr: ecgResult.rows[0]?.avg_heart_rate || 70,
        hrv_sdnn: 50, // TODO: Calculate from actual ECG data
        arrhythmia_episodes_30days: analysisResult.rows[0]?.high_risk_count || 0,
        pvc_count_24h: 0, // TODO: Calculate from actual ECG data
        afib_detected: false // TODO: Check from analysis results
      },
      lifestyle: {
        smoking_status: medHist.smoking_status || 'never',
        years_since_quit: medHist.years_since_quit_smoking || 0,
        exercise_minutes_per_week: medHist.exercise_frequency ? 150 : 60, // Estimate
        bmi: parseFloat(bmi) || 25,
        alcohol_drinks_per_week: medHist.alcohol_consumption || 0,
        diet_quality_score: 60 // TODO: Calculate from diet data
      },
      medical_history: {
        hypertension: medHist.hypertension || false,
        bp_controlled: medHist.bp_controlled || false,
        diabetes: medHist.diabetes || false,
        hba1c: medHist.hba1c || null,
        ldl_cholesterol: medHist.ldl_cholesterol || null,
        previous_heart_attack: medHist.previous_heart_attack || false,
        previous_stroke: medHist.previous_stroke || false,
        previous_cardiac_surgery: medHist.cardiac_surgery || false,
        family_history_heart_disease: medHist.family_history_heart_disease || false,
        family_history_age: medHist.family_history_age || null,
        chronic_kidney_disease: medHist.kidney_disease || false,
        sleep_apnea: medHist.sleep_apnea || false
      }
    };
    
  } catch (error) {
    console.error('Error gathering user health data:', error);
    throw error;
  }
}

module.exports = router;
