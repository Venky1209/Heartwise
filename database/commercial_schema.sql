-- HeartWise ECG Commercial System - Complete Database Schema
-- Multi-tenant architecture with user authentication and personalized data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For password hashing

-- ============================================
-- 1. USER AUTHENTICATION & ACCOUNT MANAGEMENT
-- ============================================

-- Users table (primary authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
    role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    activation_code VARCHAR(50) UNIQUE, -- Device activation code (for patients)
    activated BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(100),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    
    -- Subscription info
    subscription_tier VARCHAR(20) DEFAULT 'basic', -- basic, pro, premium
    subscription_status VARCHAR(20) DEFAULT 'trial', -- trial, active, expired, cancelled
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    last_password_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Activity tracking
    last_login TIMESTAMP WITH TIME ZONE,
    last_ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- User profiles (detailed personal information)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Physical measurements
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown')),
    
    -- Contact information
    phone VARCHAR(20),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Emergency contact
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Profile customization
    profile_photo_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(100) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session tokens (JWT refresh tokens)
CREATE TABLE session_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    device_info JSONB, -- Browser, OS, IP
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for security
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- login, logout, password_change, data_access, etc.
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. MEDICAL HISTORY & HEALTH PROFILE
-- ============================================

-- Medical history
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Cardiac history
    previous_heart_attack BOOLEAN DEFAULT FALSE,
    heart_attack_date DATE,
    previous_angina BOOLEAN DEFAULT FALSE,
    previous_arrhythmia BOOLEAN DEFAULT FALSE,
    arrhythmia_type VARCHAR(100),
    previous_heart_failure BOOLEAN DEFAULT FALSE,
    previous_stroke BOOLEAN DEFAULT FALSE,
    family_cardiac_history BOOLEAN DEFAULT FALSE,
    family_cardiac_details TEXT,
    
    -- Cardiac procedures
    cardiac_procedures TEXT[], -- Array of procedures
    last_cardiac_event_date DATE,
    pacemaker BOOLEAN DEFAULT FALSE,
    pacemaker_type VARCHAR(100),
    icd_implanted BOOLEAN DEFAULT FALSE, -- Implantable Cardioverter Defibrillator
    
    -- Risk factors
    has_hypertension BOOLEAN DEFAULT FALSE,
    hypertension_diagnosed_date DATE,
    has_diabetes BOOLEAN DEFAULT FALSE,
    diabetes_type VARCHAR(20), -- type1, type2, gestational
    has_high_cholesterol BOOLEAN DEFAULT FALSE,
    cholesterol_level DECIMAL(5,2), -- mg/dL
    
    -- Lifestyle
    smoker VARCHAR(20) CHECK (smoker IN ('never', 'former', 'current')),
    smoking_pack_years INTEGER,
    quit_smoking_date DATE,
    alcohol_consumption VARCHAR(30) CHECK (alcohol_consumption IN ('none', 'occasional', 'moderate', 'heavy')),
    exercise_frequency VARCHAR(30) CHECK (exercise_frequency IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    diet_type VARCHAR(50), -- mediterranean, vegetarian, vegan, standard, etc.
    
    -- Current vital signs baseline
    resting_heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    bmi DECIMAL(4,2),
    
    -- Additional conditions
    has_kidney_disease BOOLEAN DEFAULT FALSE,
    has_lung_disease BOOLEAN DEFAULT FALSE,
    has_thyroid_disorder BOOLEAN DEFAULT FALSE,
    other_conditions TEXT[],
    
    -- Sleep
    sleep_hours_avg DECIMAL(3,1),
    has_sleep_apnea BOOLEAN DEFAULT FALSE,
    
    -- Notes
    allergies TEXT[],
    dietary_restrictions TEXT[],
    physician_name VARCHAR(200),
    physician_phone VARCHAR(20),
    physician_email VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medications
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    medication_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    medication_class VARCHAR(100), -- beta_blocker, ace_inhibitor, statin, etc.
    dosage VARCHAR(100),
    unit VARCHAR(20), -- mg, ml, units
    frequency VARCHAR(100), -- once daily, twice daily, as needed
    route VARCHAR(50), -- oral, sublingual, injection
    
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    
    prescribing_doctor VARCHAR(200),
    prescription_number VARCHAR(100),
    pharmacy VARCHAR(200),
    
    purpose TEXT,
    side_effects TEXT,
    notes TEXT,
    
    -- Reminders
    reminder_enabled BOOLEAN DEFAULT TRUE,
    reminder_times TIME[], -- Array of times for reminders
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Symptoms tracking
CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    symptom_type VARCHAR(100) NOT NULL, -- chest_pain, shortness_of_breath, palpitations, etc.
    severity INTEGER CHECK (severity BETWEEN 1 AND 10), -- 1-10 scale
    frequency VARCHAR(50), -- constant, daily, weekly, monthly, rarely
    duration_minutes INTEGER,
    
    triggers TEXT,
    relieving_factors TEXT,
    associated_symptoms TEXT[],
    
    affected_activities TEXT[], -- walking, climbing_stairs, resting, etc.
    notes TEXT,
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. BASELINE ECG & COMPARISON
-- ============================================

-- Baseline ECGs (uploaded previous ECG reports)
CREATE TABLE baseline_ecgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recording_date DATE,
    recording_facility VARCHAR(200),
    performing_physician VARCHAR(200),
    
    -- File storage
    file_path TEXT NOT NULL, -- S3/storage path
    file_name VARCHAR(255),
    file_type VARCHAR(20), -- pdf, jpg, png, dicom
    file_size_bytes BIGINT,
    
    -- Extracted measurements
    heart_rate INTEGER,
    pr_interval INTEGER, -- milliseconds
    qrs_duration INTEGER, -- milliseconds
    qt_interval INTEGER, -- milliseconds
    qtc_interval INTEGER, -- Corrected QT
    
    -- Axes
    p_axis INTEGER, -- degrees
    qrs_axis INTEGER, -- degrees
    t_axis INTEGER, -- degrees
    
    -- Intervals
    rr_interval INTEGER, -- milliseconds
    
    -- Parsed interpretation
    interpretation TEXT,
    abnormalities_noted TEXT[],
    physician_notes TEXT,
    clinical_impression TEXT,
    
    -- Processing status
    ocr_processed BOOLEAN DEFAULT FALSE,
    manually_verified BOOLEAN DEFAULT FALSE,
    verified_by_user BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    
    -- Quality
    image_quality VARCHAR(20), -- excellent, good, fair, poor
    
    is_active_baseline BOOLEAN DEFAULT TRUE, -- Mark the current baseline
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ECG comparison results (comparing current with baseline)
CREATE TABLE ecg_comparison_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    baseline_ecg_id UUID REFERENCES baseline_ecgs(id) ON DELETE SET NULL,
    current_session_id UUID NOT NULL, -- Will link to ecg_sessions
    
    -- Detected changes
    heart_rate_change INTEGER, -- BPM difference
    heart_rate_change_percentage DECIMAL(5,2),
    
    rhythm_change_detected BOOLEAN DEFAULT FALSE,
    rhythm_before VARCHAR(100),
    rhythm_after VARCHAR(100),
    
    morphology_change_detected BOOLEAN DEFAULT FALSE,
    morphology_changes TEXT[],
    
    interval_changes JSONB, -- {pr: {before: 160, after: 180, change: +20}, ...}
    
    new_abnormalities TEXT[],
    resolved_abnormalities TEXT[],
    persistent_abnormalities TEXT[],
    
    -- Change assessment
    clinical_significance VARCHAR(50) CHECK (clinical_significance IN ('none', 'minor', 'moderate', 'significant', 'critical')),
    requires_attention BOOLEAN DEFAULT FALSE,
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('routine', 'soon', 'urgent', 'emergency')),
    
    -- AI analysis
    ai_confidence DECIMAL(5,4),
    ai_explanation TEXT,
    
    -- Alerts
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    user_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    compared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. DEVICE MANAGEMENT
-- ============================================

-- Devices (ECG monitors)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Device identification
    device_id VARCHAR(100) UNIQUE NOT NULL, -- MAC address or UUID
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    model_number VARCHAR(50) NOT NULL,
    manufacturing_date DATE,
    
    -- Activation
    activation_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activated BOOLEAN DEFAULT FALSE,
    activation_date TIMESTAMP WITH TIME ZONE,
    
    -- Device info
    firmware_version VARCHAR(20),
    hardware_version VARCHAR(20),
    device_name VARCHAR(200), -- User-assigned name
    
    -- Status
    last_connection TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    
    -- Calibration
    calibration_date TIMESTAMP WITH TIME ZONE,
    calibration_data JSONB,
    needs_calibration BOOLEAN DEFAULT FALSE,
    
    -- Warranty
    warranty_start_date DATE,
    warranty_end_date DATE,
    warranty_status VARCHAR(20) DEFAULT 'active', -- active, expired, void
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device transfer history
CREATE TABLE device_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(50) NOT NULL, -- activated, deactivated, transferred, calibrated, firmware_updated
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    notes TEXT,
    
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. ECG SESSIONS & DATA (Enhanced)
-- ============================================

-- ECG Sessions
CREATE TABLE ecg_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    
    session_name VARCHAR(200),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Recording parameters
    sample_rate INTEGER NOT NULL DEFAULT 250, -- Hz
    lead VARCHAR(10) DEFAULT 'I', -- ECG lead
    
    -- Session metadata
    recording_position VARCHAR(50), -- lying_down, sitting, standing, post_exercise
    activity_before VARCHAR(100), -- resting, walking, exercise, eating, medication
    symptoms_during TEXT[],
    notes TEXT,
    
    -- Data quality
    signal_quality_avg DECIMAL(3,2), -- 0.00 to 1.00
    artifacts_detected INTEGER,
    usable_data_percentage DECIMAL(5,2),
    
    -- Processing status
    is_completed BOOLEAN DEFAULT FALSE,
    analyzed BOOLEAN DEFAULT FALSE,
    analysis_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Comparison
    compared_to_baseline BOOLEAN DEFAULT FALSE,
    comparison_id UUID REFERENCES ecg_comparison_results(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ECG Data Points
CREATE TABLE ecg_data_points (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES ecg_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Redundant but useful for partitioning
    
    timestamp_ms BIGINT NOT NULL, -- Milliseconds since session start
    voltage_mv DECIMAL(10, 6) NOT NULL, -- Millivolts
    
    lead VARCHAR(10) DEFAULT 'I',
    quality_score DECIMAL(3, 2), -- 0.00 to 1.00
    is_artifact BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ECG Analysis Results
CREATE TABLE ecg_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ecg_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Analysis type
    analysis_type VARCHAR(100) NOT NULL, -- ensemble, deep_learning, rule_based
    model_version VARCHAR(50),
    
    -- Results
    classification VARCHAR(100), -- normal_sinus, atrial_fibrillation, etc.
    confidence_score DECIMAL(5, 4), -- 0.0000 to 1.0000
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Detailed findings
    heart_rate INTEGER,
    heart_rate_variability DECIMAL(5,2),
    rhythm_type VARCHAR(100),
    rhythm_regularity VARCHAR(50), -- regular, regularly_irregular, irregularly_irregular
    
    abnormalities_detected JSONB, -- Array of detected issues
    measurements JSONB, -- Detailed measurements
    predictions JSONB, -- Raw model predictions
    
    recommendations TEXT,
    
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. TREND ANALYSIS
-- ============================================

-- Trend analysis summaries
CREATE TABLE trend_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    analysis_period VARCHAR(20) CHECK (analysis_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Calculated metrics
    total_sessions INTEGER,
    avg_heart_rate DECIMAL(5,2),
    min_heart_rate INTEGER,
    max_heart_rate INTEGER,
    heart_rate_variability DECIMAL(5,2),
    
    -- Rhythm statistics
    normal_rhythm_percentage DECIMAL(5,2),
    abnormal_episodes_count INTEGER,
    abnormal_rhythm_types JSONB, -- {af: 3, svt: 1, ...}
    
    -- Comparison with baseline
    deviation_from_baseline DECIMAL(5,2),
    significant_changes TEXT[],
    improvement_indicators TEXT[],
    concern_indicators TEXT[],
    
    -- Health metrics
    cardiac_health_score INTEGER CHECK (cardiac_health_score BETWEEN 0 AND 100),
    fitness_level VARCHAR(20), -- poor, fair, average, good, excellent
    
    -- Trends
    heart_rate_trend VARCHAR(20), -- improving, stable, declining
    hrv_trend VARCHAR(20),
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health alerts
CREATE TABLE health_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES ecg_sessions(id) ON DELETE SET NULL,
    comparison_id UUID REFERENCES ecg_comparison_results(id) ON DELETE SET NULL,
    
    alert_type VARCHAR(50) NOT NULL, -- baseline_deviation, new_arrhythmia, significant_change, medication_reminder
    severity VARCHAR(20) CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT,
    
    action_required BOOLEAN DEFAULT FALSE,
    action_url TEXT, -- Link to relevant page
    
    -- Notification
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    notification_method VARCHAR(20), -- email, sms, push
    
    -- User interaction
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. DIET & NUTRITION
-- ============================================

-- Diet plans
CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    plan_name VARCHAR(200) NOT NULL,
    plan_type VARCHAR(50), -- cardiac_recovery, weight_loss, maintenance, performance
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Dietary goals
    daily_calorie_target INTEGER,
    protein_target_g DECIMAL(5,2),
    carbs_target_g DECIMAL(5,2),
    fat_target_g DECIMAL(5,2),
    fiber_target_g DECIMAL(5,2),
    
    -- Restrictions (based on medical condition)
    sodium_limit_mg INTEGER, -- For hypertension
    saturated_fat_limit_g DECIMAL(5,2), -- For cholesterol
    sugar_limit_g DECIMAL(5,2), -- For diabetes
    fluid_limit_ml INTEGER, -- For heart failure
    potassium_limit_mg INTEGER, -- For kidney disease
    
    -- Diet style
    diet_style VARCHAR(50), -- dash, mediterranean, low_sodium, diabetic_friendly
    
    -- Conditions this plan addresses
    condition_based_on TEXT[], -- hypertension, high_cholesterol, diabetes, etc.
    
    -- Preferences
    exclude_foods TEXT[],
    preferred_cuisines TEXT[],
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_by VARCHAR(100), -- ai, nutritionist, self
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meals library
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    meal_name VARCHAR(200) NOT NULL,
    meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    cuisine_type VARCHAR(50),
    
    description TEXT,
    recipe_instructions TEXT,
    preparation_time_minutes INTEGER,
    cooking_time_minutes INTEGER,
    servings INTEGER DEFAULT 1,
    
    -- Ingredients
    ingredients JSONB NOT NULL, -- [{name, quantity, unit, calories, ...}]
    
    -- Nutrition facts (per serving)
    calories INTEGER NOT NULL,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fat_g DECIMAL(5,2),
    saturated_fat_g DECIMAL(5,2),
    trans_fat_g DECIMAL(5,2),
    cholesterol_mg INTEGER,
    sodium_mg INTEGER,
    potassium_mg INTEGER,
    fiber_g DECIMAL(5,2),
    sugar_g DECIMAL(5,2),
    
    -- Vitamins & minerals (optional)
    vitamin_c_mg DECIMAL(5,2),
    calcium_mg DECIMAL(5,2),
    iron_mg DECIMAL(5,2),
    
    -- Tags
    is_heart_healthy BOOLEAN DEFAULT TRUE,
    is_diabetic_friendly BOOLEAN DEFAULT FALSE,
    is_low_sodium BOOLEAN DEFAULT FALSE,
    is_low_cholesterol BOOLEAN DEFAULT FALSE,
    is_high_fiber BOOLEAN DEFAULT FALSE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    
    difficulty_level VARCHAR(20), -- easy, medium, hard
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Weekly meal assignments
CREATE TABLE diet_plan_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    
    week_number INTEGER NOT NULL, -- 1, 2, 3, etc.
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
    meal_slot VARCHAR(20) NOT NULL, -- breakfast, lunch, dinner, snack1, snack2
    
    -- Customization
    portion_multiplier DECIMAL(3,2) DEFAULT 1.0, -- 0.5 = half portion, 2.0 = double
    substitutions JSONB, -- Custom ingredient swaps
    
    UNIQUE(diet_plan_id, week_number, day_number, meal_slot)
);

-- Meal consumption tracking
CREATE TABLE meal_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    diet_plan_meal_id UUID REFERENCES diet_plan_meals(id) ON DELETE SET NULL,
    meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
    
    scheduled_date DATE NOT NULL,
    scheduled_meal_slot VARCHAR(20),
    
    consumed BOOLEAN DEFAULT FALSE,
    consumed_at TIMESTAMP WITH TIME ZONE,
    portion_size DECIMAL(3,2) DEFAULT 1.0, -- Actual portion eaten
    
    -- User feedback
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    liked BOOLEAN,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily nutrition summary
CREATE TABLE nutrition_daily_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Totals
    total_calories INTEGER,
    total_protein_g DECIMAL(5,2),
    total_carbs_g DECIMAL(5,2),
    total_fat_g DECIMAL(5,2),
    total_saturated_fat_g DECIMAL(5,2),
    total_sodium_mg INTEGER,
    total_fiber_g DECIMAL(5,2),
    total_sugar_g DECIMAL(5,2),
    
    -- Targets
    calorie_target INTEGER,
    sodium_limit_mg INTEGER,
    
    -- Compliance
    within_sodium_limit BOOLEAN,
    within_calorie_target BOOLEAN,
    within_fat_limit BOOLEAN,
    
    meals_logged INTEGER,
    meals_planned INTEGER,
    
    compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

-- User-related indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_activation_code ON users(activation_code);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Session indexes
CREATE INDEX idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX idx_session_tokens_token ON session_tokens(token);

-- Medical history indexes
CREATE INDEX idx_medical_history_user_id ON medical_history(user_id);
CREATE INDEX idx_medications_user_id ON medications(user_id);
CREATE INDEX idx_medications_current ON medications(user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_symptoms_user_id_recorded ON symptoms(user_id, recorded_at);

-- Device indexes
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_activation_code ON devices(activation_code);

-- ECG data indexes
CREATE INDEX idx_ecg_sessions_user_id ON ecg_sessions(user_id);
CREATE INDEX idx_ecg_sessions_device_id ON ecg_sessions(device_id);
CREATE INDEX idx_ecg_sessions_start_time ON ecg_sessions(user_id, start_time);
CREATE INDEX idx_ecg_data_session_id ON ecg_data_points(session_id);
CREATE INDEX idx_ecg_data_user_id ON ecg_data_points(user_id);
CREATE INDEX idx_ecg_data_timestamp ON ecg_data_points(session_id, timestamp_ms);
CREATE INDEX idx_ecg_analysis_session ON ecg_analysis_results(session_id);
CREATE INDEX idx_ecg_analysis_user ON ecg_analysis_results(user_id);

-- Baseline & comparison indexes
CREATE INDEX idx_baseline_ecgs_user_id ON baseline_ecgs(user_id);
CREATE INDEX idx_baseline_ecgs_active ON baseline_ecgs(user_id, is_active_baseline) WHERE is_active_baseline = TRUE;
CREATE INDEX idx_comparison_user_id ON ecg_comparison_results(user_id);

-- Trend & alerts indexes
CREATE INDEX idx_trend_analysis_user_period ON trend_analysis(user_id, analysis_period, start_date);
CREATE INDEX idx_health_alerts_user_id ON health_alerts(user_id);
CREATE INDEX idx_health_alerts_unacknowledged ON health_alerts(user_id, acknowledged) WHERE acknowledged = FALSE;

-- Diet indexes
CREATE INDEX idx_diet_plans_user_active ON diet_plans(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_meals_heart_healthy ON meals(is_heart_healthy) WHERE is_heart_healthy = TRUE;
CREATE INDEX idx_meal_tracking_user_date ON meal_tracking(user_id, scheduled_date);
CREATE INDEX idx_nutrition_summary_user_date ON nutrition_daily_summary(user_id, date);

-- Audit log index
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log device actions
CREATE OR REPLACE FUNCTION log_device_action()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
        INSERT INTO device_history (device_id, user_id, action)
        VALUES (NEW.id, NEW.user_id, 'transferred');
    ELSIF (TG_OP = 'UPDATE' AND OLD.activated = FALSE AND NEW.activated = TRUE) THEN
        INSERT INTO device_history (device_id, user_id, action)
        VALUES (NEW.id, NEW.user_id, 'activated');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER device_action_logger AFTER UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION log_device_action();

-- Function to calculate BMI automatically
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL AND NEW.height_cm > 0 THEN
        UPDATE medical_history 
        SET bmi = NEW.weight_kg / POWER(NEW.height_cm / 100.0, 2)
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_calculate_bmi AFTER INSERT OR UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION calculate_bmi();

-- ============================================
-- 10. VIEWS FOR COMMON QUERIES
-- ============================================

-- View: User dashboard summary
CREATE VIEW user_dashboard_summary AS
SELECT 
    u.id AS user_id,
    u.email,
    up.first_name,
    up.last_name,
    u.subscription_tier,
    u.subscription_status,
    COUNT(DISTINCT es.id) AS total_sessions,
    MAX(es.start_time) AS last_session_date,
    COUNT(DISTINCT d.id) AS connected_devices,
    COUNT(DISTINCT ha.id) FILTER (WHERE ha.acknowledged = FALSE) AS unread_alerts,
    (SELECT cardiac_health_score FROM trend_analysis 
     WHERE user_id = u.id AND analysis_period = 'monthly' 
     ORDER BY end_date DESC LIMIT 1) AS latest_health_score
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN ecg_sessions es ON u.id = es.user_id
LEFT JOIN devices d ON u.id = d.user_id AND d.is_active = TRUE
LEFT JOIN health_alerts ha ON u.id = ha.user_id
GROUP BY u.id, u.email, up.first_name, up.last_name, u.subscription_tier, u.subscription_status;

-- View: Active medications per user
CREATE VIEW active_medications_view AS
SELECT 
    m.*,
    up.first_name,
    up.last_name
FROM medications m
JOIN user_profiles up ON m.user_id = up.user_id
WHERE m.is_current = TRUE
ORDER BY m.user_id, m.medication_name;

-- View: Latest ECG for each user
CREATE VIEW latest_ecg_by_user AS
SELECT DISTINCT ON (user_id)
    user_id,
    id AS session_id,
    start_time,
    duration_seconds,
    signal_quality_avg,
    analyzed
FROM ecg_sessions
ORDER BY user_id, start_time DESC;

-- ============================================
-- DOCTOR/HEALTHCARE PROVIDER TABLES
-- ============================================

-- Doctor profiles (detailed professional information)
CREATE TABLE doctor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Professional information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(100), -- Cardiologist, General Practitioner, etc.
    
    -- Contact information
    phone VARCHAR(20),
    clinic_name VARCHAR(200),
    clinic_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Professional details
    years_of_experience INTEGER,
    education TEXT,
    certifications TEXT[],
    
    -- Profile
    profile_photo_url TEXT,
    bio TEXT,
    consultation_fee DECIMAL(10,2),
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctor-Patient relationships
CREATE TABLE doctor_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Relationship details
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
    is_primary_doctor BOOLEAN DEFAULT TRUE,
    
    -- Access permissions
    can_view_ecg BOOLEAN DEFAULT TRUE,
    can_view_medical_history BOOLEAN DEFAULT TRUE,
    can_prescribe BOOLEAN DEFAULT TRUE,
    
    -- Notes
    assignment_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(doctor_id, patient_id)
);

-- Prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prescription details
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL, -- "Once daily", "Twice daily", etc.
    duration VARCHAR(100), -- "30 days", "Ongoing", etc.
    route VARCHAR(50), -- "Oral", "IV", "Topical", etc.
    
    -- Instructions
    instructions TEXT NOT NULL,
    side_effects TEXT,
    precautions TEXT,
    
    -- Prescription metadata
    diagnosis VARCHAR(200),
    prescription_date DATE DEFAULT CURRENT_DATE,
    start_date DATE,
    end_date DATE,
    refills_allowed INTEGER DEFAULT 0,
    refills_remaining INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    cancelled_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctor instructions/notes for patients
CREATE TABLE doctor_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Instruction details
    title VARCHAR(200) NOT NULL,
    instruction_type VARCHAR(50) CHECK (instruction_type IN ('general', 'diet', 'exercise', 'medication', 'lifestyle', 'emergency', 'follow_up')),
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Related data
    related_ecg_session_id UUID REFERENCES ecg_sessions(id),
    related_prescription_id UUID REFERENCES prescriptions(id),
    
    -- Patient acknowledgment
    read_by_patient BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    patient_response TEXT,
    patient_response_at TIMESTAMP WITH TIME ZONE,
    
    -- Validity
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctor's ECG review notes
CREATE TABLE ecg_doctor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ecg_session_id UUID NOT NULL REFERENCES ecg_sessions(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Review details
    review_notes TEXT NOT NULL,
    diagnosis TEXT,
    recommended_actions TEXT,
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('routine', 'follow_up', 'urgent', 'emergency')),
    
    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- Review metadata
    review_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(ecg_session_id, doctor_id)
);

-- Consultation appointments
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Appointment details
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    consultation_type VARCHAR(50) CHECK (consultation_type IN ('in_person', 'video', 'phone', 'chat')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    cancellation_reason TEXT,
    
    -- Consultation details
    chief_complaint TEXT,
    consultation_notes TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    
    -- Billing
    fee DECIMAL(10,2),
    paid BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR DOCTOR TABLES
-- ============================================

CREATE INDEX idx_doctor_profiles_user_id ON doctor_profiles(user_id);
CREATE INDEX idx_doctor_profiles_license ON doctor_profiles(license_number);
CREATE INDEX idx_doctor_patients_doctor ON doctor_patients(doctor_id);
CREATE INDEX idx_doctor_patients_patient ON doctor_patients(patient_id);
CREATE INDEX idx_doctor_patients_status ON doctor_patients(status);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_dates ON prescriptions(start_date, end_date);
CREATE INDEX idx_doctor_instructions_doctor ON doctor_instructions(doctor_id);
CREATE INDEX idx_doctor_instructions_patient ON doctor_instructions(patient_id);
CREATE INDEX idx_doctor_instructions_type ON doctor_instructions(instruction_type);
CREATE INDEX idx_doctor_instructions_unread ON doctor_instructions(patient_id, read_by_patient) WHERE read_by_patient = FALSE;
CREATE INDEX idx_ecg_reviews_session ON ecg_doctor_reviews(ecg_session_id);
CREATE INDEX idx_ecg_reviews_doctor ON ecg_doctor_reviews(doctor_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_date ON consultations(appointment_date);
CREATE INDEX idx_consultations_status ON consultations(status);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'Primary authentication table with role-based access and subscription management';
COMMENT ON TABLE user_profiles IS 'Detailed personal information and emergency contacts';
COMMENT ON TABLE doctor_profiles IS 'Healthcare provider professional information and credentials';
COMMENT ON TABLE doctor_patients IS 'Doctor-patient relationships and access permissions';
COMMENT ON TABLE prescriptions IS 'Medication prescriptions issued by doctors to patients';
COMMENT ON TABLE doctor_instructions IS 'General instructions and guidance from doctors to patients';
COMMENT ON TABLE ecg_doctor_reviews IS 'Doctor reviews and analysis of patient ECG sessions';
COMMENT ON TABLE consultations IS 'Scheduled appointments between doctors and patients';
COMMENT ON TABLE medical_history IS 'Comprehensive cardiac and general medical history';
COMMENT ON TABLE baseline_ecgs IS 'Uploaded historical ECG reports for comparison';
COMMENT ON TABLE ecg_comparison_results IS 'Analysis comparing current ECG with baseline';
COMMENT ON TABLE devices IS 'Physical ECG monitoring devices with activation codes';
COMMENT ON TABLE diet_plans IS 'Personalized cardiac-friendly meal plans';
COMMENT ON TABLE health_alerts IS 'User notifications for health changes and reminders';
