-- ====================================================================
-- HEARTWISE RISK SCORING SCHEMA
-- Predictive cardiac risk assessment system
-- ====================================================================

-- Risk Scores Table: Stores calculated risk assessments
CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Overall Risk Score (0-100)
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    
    -- Risk Breakdown by Category (0-100 each)
    ecg_risk_score INTEGER CHECK (ecg_risk_score >= 0 AND ecg_risk_score <= 100),
    lifestyle_risk_score INTEGER CHECK (lifestyle_risk_score >= 0 AND lifestyle_risk_score <= 100),
    medical_history_risk_score INTEGER CHECK (medical_history_risk_score >= 0 AND medical_history_risk_score <= 100),
    demographic_risk_score INTEGER CHECK (demographic_risk_score >= 0 AND demographic_risk_score <= 100),
    
    -- Time-based Risk Predictions (probability 0-100)
    risk_30_days INTEGER CHECK (risk_30_days >= 0 AND risk_30_days <= 100),
    risk_90_days INTEGER CHECK (risk_90_days >= 0 AND risk_90_days <= 100),
    risk_1_year INTEGER CHECK (risk_1_year >= 0 AND risk_1_year <= 100),
    
    -- Contributing Factors (JSON array of factors)
    high_risk_factors JSONB DEFAULT '[]'::jsonb,
    moderate_risk_factors JSONB DEFAULT '[]'::jsonb,
    protective_factors JSONB DEFAULT '[]'::jsonb,
    
    -- Detailed Metrics Used in Calculation
    metrics_snapshot JSONB,
    -- Example: {
    --   "age": 55,
    --   "resting_hr": 78,
    --   "hrv_sdnn": 45,
    --   "arrhythmia_episodes": 3,
    --   "bmi": 28.5,
    --   "smoking": true,
    --   "diabetes": false
    -- }
    
    -- Recommendations
    recommendations JSONB DEFAULT '[]'::jsonb,
    -- Example: [
    --   {"priority": "high", "action": "Reduce sodium intake", "impact": 15},
    --   {"priority": "medium", "action": "Exercise 30 min daily", "impact": 12}
    -- ]
    
    -- ML Model Info
    model_version VARCHAR(50),
    confidence_score DECIMAL(5,4), -- Model confidence (0-1)
    
    -- Comparison with Previous Score
    previous_score INTEGER,
    score_change INTEGER, -- Positive = worse, negative = better
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE, -- Score expires after 30 days
    
    -- Indexes
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Risk Factor Tracking: Detailed tracking of individual risk factors
CREATE TABLE IF NOT EXISTS risk_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Factor Information
    factor_name VARCHAR(100) NOT NULL,
    factor_category VARCHAR(50) NOT NULL CHECK (factor_category IN (
        'cardiac_history', 'lifestyle', 'vital_signs', 'ecg_metrics', 'family_history', 'medications'
    )),
    
    -- Risk Level
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
    risk_contribution INTEGER CHECK (risk_contribution >= 0 AND risk_contribution <= 100), -- % contribution to overall risk
    
    -- Current Status
    current_value TEXT,
    normal_range TEXT,
    is_modifiable BOOLEAN DEFAULT true,
    
    -- Tracking
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'improving', 'resolved', 'worsening'))
);

-- Risk Score History: Track changes over time
CREATE TABLE IF NOT EXISTS risk_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_score_id UUID REFERENCES risk_scores(id) ON DELETE CASCADE,
    
    -- Score at this point in time
    overall_score INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    
    -- What changed
    change_reason TEXT,
    factors_changed JSONB,
    
    -- Timestamp
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Risk Alerts: Trigger alerts based on risk changes
CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_score_id UUID REFERENCES risk_scores(id) ON DELETE CASCADE,
    
    -- Alert Information
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'risk_increase', 'critical_risk', 'new_risk_factor', 'risk_improvement', 'score_expiring'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Message
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_required BOOLEAN DEFAULT false,
    action_url TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'acknowledged', 'dismissed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_risk_scores_user_id ON risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_calculated_at ON risk_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scores_level ON risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_factors_user_id ON risk_factors(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_factors_category ON risk_factors(factor_category);
CREATE INDEX IF NOT EXISTS idx_risk_score_history_user_id ON risk_score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_score_history_recorded_at ON risk_score_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_user_id ON risk_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON risk_alerts(status);

-- Function: Get Latest Risk Score for User
CREATE OR REPLACE FUNCTION get_latest_risk_score(p_user_id UUID)
RETURNS TABLE (
    risk_score_id UUID,
    overall_score INTEGER,
    risk_level VARCHAR,
    calculated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, overall_score, risk_level, calculated_at
    FROM risk_scores
    WHERE user_id = p_user_id
    ORDER BY calculated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Risk Trend (Improving/Worsening/Stable)
CREATE OR REPLACE FUNCTION calculate_risk_trend(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TEXT AS $$
DECLARE
    v_recent_avg DECIMAL;
    v_previous_avg DECIMAL;
    v_trend TEXT;
BEGIN
    -- Average score in last p_days
    SELECT AVG(overall_score) INTO v_recent_avg
    FROM risk_scores
    WHERE user_id = p_user_id
    AND calculated_at >= NOW() - INTERVAL '1 day' * p_days;
    
    -- Average score in previous p_days
    SELECT AVG(overall_score) INTO v_previous_avg
    FROM risk_scores
    WHERE user_id = p_user_id
    AND calculated_at >= NOW() - INTERVAL '1 day' * (p_days * 2)
    AND calculated_at < NOW() - INTERVAL '1 day' * p_days;
    
    IF v_recent_avg IS NULL OR v_previous_avg IS NULL THEN
        RETURN 'insufficient_data';
    ELSIF v_recent_avg > v_previous_avg + 5 THEN
        RETURN 'worsening';
    ELSIF v_recent_avg < v_previous_avg - 5 THEN
        RETURN 'improving';
    ELSE
        RETURN 'stable';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create risk alert on critical risk
CREATE OR REPLACE FUNCTION create_critical_risk_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.risk_level = 'critical' THEN
        INSERT INTO risk_alerts (user_id, risk_score_id, alert_type, severity, title, message, action_required)
        VALUES (
            NEW.user_id,
            NEW.id,
            'critical_risk',
            'critical',
            '🚨 Critical Cardiac Risk Detected',
            'Your cardiac risk score is critically high (' || NEW.overall_score || '/100). Please consult a cardiologist immediately.',
            true
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_critical_risk_alert
AFTER INSERT ON risk_scores
FOR EACH ROW
EXECUTE FUNCTION create_critical_risk_alert();

-- Trigger: Track risk score changes in history
CREATE OR REPLACE FUNCTION track_risk_score_history()
RETURNS TRIGGER AS $$
DECLARE
    v_previous_score INTEGER;
BEGIN
    -- Get previous score
    SELECT overall_score INTO v_previous_score
    FROM risk_scores
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    ORDER BY calculated_at DESC
    LIMIT 1;
    
    -- Insert into history
    INSERT INTO risk_score_history (user_id, risk_score_id, overall_score, risk_level, change_reason)
    VALUES (
        NEW.user_id,
        NEW.id,
        NEW.overall_score,
        NEW.risk_level,
        CASE
            WHEN v_previous_score IS NULL THEN 'Initial risk assessment'
            WHEN NEW.overall_score > v_previous_score THEN 'Risk increased by ' || (NEW.overall_score - v_previous_score) || ' points'
            WHEN NEW.overall_score < v_previous_score THEN 'Risk decreased by ' || (v_previous_score - NEW.overall_score) || ' points'
            ELSE 'Risk score recalculated'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_risk_history
AFTER INSERT ON risk_scores
FOR EACH ROW
EXECUTE FUNCTION track_risk_score_history();

-- View: User Risk Dashboard Summary
CREATE OR REPLACE VIEW v_user_risk_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    up.first_name,
    up.last_name,
    rs.overall_score,
    rs.risk_level,
    rs.ecg_risk_score,
    rs.lifestyle_risk_score,
    rs.medical_history_risk_score,
    rs.demographic_risk_score,
    rs.risk_30_days,
    rs.risk_90_days,
    rs.risk_1_year,
    rs.calculated_at as last_calculated,
    rs.valid_until,
    calculate_risk_trend(u.id, 30) as trend_30_days,
    (SELECT COUNT(*) FROM risk_alerts WHERE user_id = u.id AND status = 'unread') as unread_alerts,
    (SELECT COUNT(*) FROM risk_factors WHERE user_id = u.id AND severity IN ('high', 'critical') AND status = 'active') as critical_factors
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN LATERAL (
    SELECT * FROM risk_scores
    WHERE user_id = u.id
    ORDER BY calculated_at DESC
    LIMIT 1
) rs ON true;

-- Sample Risk Factors Reference Data
CREATE TABLE IF NOT EXISTS risk_factor_definitions (
    id SERIAL PRIMARY KEY,
    factor_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    normal_range TEXT,
    high_risk_threshold TEXT,
    modifiable BOOLEAN DEFAULT true,
    recommendation_template TEXT
);

-- Insert common risk factors
INSERT INTO risk_factor_definitions (factor_name, category, description, normal_range, high_risk_threshold, modifiable, recommendation_template) VALUES
('High Resting Heart Rate', 'vital_signs', 'Resting heart rate above normal range', '60-100 BPM', '>100 BPM', true, 'Practice relaxation techniques, reduce caffeine, increase cardiovascular exercise'),
('Low HRV', 'ecg_metrics', 'Heart rate variability below healthy range', 'SDNN >50ms', 'SDNN <30ms', true, 'Improve sleep quality, manage stress, practice meditation'),
('Frequent Arrhythmias', 'ecg_metrics', 'Multiple irregular heartbeat episodes detected', '<5 per day', '>10 per day', true, 'Avoid triggers (caffeine, alcohol), consult cardiologist'),
('Smoking', 'lifestyle', 'Current tobacco use', 'Non-smoker', 'Active smoker', true, 'Enroll in smoking cessation program, use nicotine replacement therapy'),
('Obesity', 'lifestyle', 'BMI above healthy range', 'BMI 18.5-24.9', 'BMI >30', true, 'Create calorie deficit of 500 cal/day, exercise 150 min/week'),
('Hypertension', 'vital_signs', 'High blood pressure', '<120/80 mmHg', '>140/90 mmHg', true, 'Reduce sodium intake, DASH diet, increase potassium, monitor BP daily'),
('Diabetes', 'medical_history', 'Type 1 or Type 2 diabetes diagnosis', 'Non-diabetic', 'Diabetic', true, 'Maintain HbA1c <7%, carbohydrate counting, regular glucose monitoring'),
('Family History', 'family_history', 'First-degree relative with heart disease before age 55', 'None', 'Present', false, 'Regular cardiac screenings, aggressive risk factor management'),
('Sedentary Lifestyle', 'lifestyle', 'Physical activity below recommended levels', '>150 min/week', '<60 min/week', true, 'Start with 10-minute walks, gradually increase to 30 min daily'),
('High Cholesterol', 'vital_signs', 'Elevated LDL cholesterol', 'LDL <100 mg/dL', 'LDL >160 mg/dL', true, 'Mediterranean diet, reduce saturated fats, consider statin therapy')
ON CONFLICT (factor_name) DO NOTHING;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON risk_scores TO heartwise_user;
-- GRANT SELECT, INSERT, UPDATE ON risk_factors TO heartwise_user;
-- GRANT SELECT ON v_user_risk_dashboard TO heartwise_user;

COMMENT ON TABLE risk_scores IS 'Stores calculated cardiac risk assessments with detailed breakdowns';
COMMENT ON TABLE risk_factors IS 'Individual risk factors contributing to overall cardiac risk';
COMMENT ON TABLE risk_score_history IS 'Historical tracking of risk score changes over time';
COMMENT ON TABLE risk_alerts IS 'Alerts triggered by risk score changes or critical conditions';
COMMENT ON FUNCTION get_latest_risk_score IS 'Retrieves the most recent risk score for a user';
COMMENT ON FUNCTION calculate_risk_trend IS 'Calculates whether risk is improving, worsening, or stable';
