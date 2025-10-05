# HeartWise Commercial System - Complete Implementation Plan

## 🎯 Business Model Overview

**Product**: Portable ECG Monitor + Personalized Web Platform
**Target**: Individual customers purchasing device + subscription service
**Value Proposition**: 
- Personal cardiac health monitoring at home
- Historical trend analysis and anomaly detection
- Personalized diet plans based on cardiac health
- Long-term health data storage and insights

---

## 🏗️ System Architecture

### 1. **User Authentication & Account Management**

#### Features to Implement:
- **Registration System**
  - Email/password registration
  - Purchase verification (device activation code)
  - Email verification
  - Terms of service & privacy policy acceptance
  
- **Login System**
  - Secure authentication (JWT tokens)
  - Session management
  - Password reset via email
  - Two-factor authentication (optional, recommended)

- **User Profile Management**
  - Personal information (name, age, gender, height, weight)
  - Contact information
  - Emergency contacts
  - Profile photo upload

#### Database Schema:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activation_code VARCHAR(50) UNIQUE,
    activated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    blood_type VARCHAR(5),
    phone VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    profile_photo_url TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2. **Medical History & Onboarding**

#### Comprehensive Health Questionnaire:

**Section A: Cardiac History**
- Previous heart conditions (heart attack, angina, arrhythmia, heart failure)
- Previous cardiac procedures (bypass, stent, ablation, pacemaker)
- Family history of cardiac disease
- Date of last cardiac event/procedure

**Section B: Risk Factors**
- Hypertension (high blood pressure)
- Diabetes
- High cholesterol
- Smoking history
- Alcohol consumption
- Obesity/BMI
- Sedentary lifestyle

**Section C: Current Medications**
- List of all medications with dosage
- Blood thinners
- Beta-blockers
- ACE inhibitors
- Statins
- Other cardiac medications

**Section D: Symptoms**
- Chest pain frequency
- Shortness of breath
- Palpitations
- Dizziness/fainting
- Fatigue levels
- Exercise tolerance

#### Database Schema:
```sql
CREATE TABLE medical_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Cardiac History
    previous_heart_attack BOOLEAN DEFAULT FALSE,
    previous_angina BOOLEAN DEFAULT FALSE,
    previous_arrhythmia BOOLEAN DEFAULT FALSE,
    previous_heart_failure BOOLEAN DEFAULT FALSE,
    family_cardiac_history BOOLEAN DEFAULT FALSE,
    cardiac_procedures TEXT[], -- Array of procedures
    last_cardiac_event_date DATE,
    
    -- Risk Factors
    has_hypertension BOOLEAN DEFAULT FALSE,
    has_diabetes BOOLEAN DEFAULT FALSE,
    has_high_cholesterol BOOLEAN DEFAULT FALSE,
    smoker VARCHAR(20), -- never, former, current
    alcohol_consumption VARCHAR(30), -- none, occasional, moderate, heavy
    exercise_frequency VARCHAR(30), -- sedentary, light, moderate, active
    
    -- Vital Signs
    resting_heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    start_date DATE,
    end_date DATE,
    prescribing_doctor VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE symptoms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    symptom_type VARCHAR(100), -- chest_pain, shortness_of_breath, palpitations, etc.
    severity INTEGER, -- 1-10 scale
    frequency VARCHAR(50), -- daily, weekly, monthly, rarely
    triggers TEXT,
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. **Previous ECG Upload & Baseline Analysis**

#### Features:
- Upload previous ECG reports (PDF, images, DICOM files)
- OCR/parsing to extract key measurements
- Establish personal baseline
- Store as reference for comparison

#### Supported Upload Formats:
- PDF reports from hospitals/clinics
- JPG/PNG images of ECG printouts
- DICOM files (medical standard)
- Manual entry of key parameters

#### Extracted Data Points:
- Heart rate
- PR interval
- QRS duration
- QT interval
- P wave morphology
- QRS axis
- T wave morphology
- Any noted abnormalities
- Date of recording
- Recording facility

#### Database Schema:
```sql
CREATE TABLE baseline_ecgs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recording_date DATE,
    recording_facility VARCHAR(200),
    file_path TEXT, -- stored file location
    file_type VARCHAR(20), -- pdf, image, dicom
    
    -- Extracted measurements
    heart_rate INTEGER,
    pr_interval INTEGER,
    qrs_duration INTEGER,
    qt_interval INTEGER,
    qtc_interval INTEGER,
    p_axis INTEGER,
    qrs_axis INTEGER,
    t_axis INTEGER,
    
    -- Parsed text from report
    interpretation TEXT,
    physician_notes TEXT,
    
    -- Processing status
    parsed BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE, -- user verified accuracy
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ecg_comparison_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    baseline_ecg_id INTEGER REFERENCES baseline_ecgs(id),
    current_session_id INTEGER REFERENCES sessions(id),
    
    -- Detected changes
    heart_rate_change INTEGER,
    rhythm_change_detected BOOLEAN,
    morphology_change_detected BOOLEAN,
    new_abnormalities TEXT[],
    resolved_abnormalities TEXT[],
    
    -- Change significance
    clinical_significance VARCHAR(50), -- none, minor, moderate, significant
    requires_attention BOOLEAN DEFAULT FALSE,
    alert_sent BOOLEAN DEFAULT FALSE,
    
    compared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4. **Device Registration & Pairing**

#### Features:
- Unique activation code printed on each device box
- One-time device activation
- Device-user binding
- Support multiple devices per user (family sharing)
- Device transfer/ownership change

#### Activation Flow:
1. Customer receives physical ECG device with activation code
2. During registration, user enters activation code
3. System validates code (unused, valid)
4. Device gets paired with user account
5. Device MAC address stored for authentication
6. Device can now send data only to that user's account

#### Database Schema:
```sql
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL, -- MAC address or UUID
    activation_code VARCHAR(50) UNIQUE NOT NULL,
    model_number VARCHAR(50),
    serial_number VARCHAR(100) UNIQUE,
    manufacturing_date DATE,
    
    -- Pairing info
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    activated BOOLEAN DEFAULT FALSE,
    activation_date TIMESTAMP,
    last_connection TIMESTAMP,
    
    -- Device status
    firmware_version VARCHAR(20),
    battery_level INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_history (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50), -- activated, deactivated, transferred
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

---

### 5. **Per-User Data Isolation & Management**

#### Multi-Tenant Architecture:
- Each user's data completely isolated
- Row-level security in database
- User-specific data partitioning
- Encrypted storage for sensitive data

#### Data Organization:
```
User Account
└── Profile
└── Medical History
└── Medications
└── Baseline ECGs
└── Devices
└── Sessions (ECG recordings)
    ├── Session 1 (Jan 1, 2025)
    ├── Session 2 (Jan 8, 2025)
    └── Session 3 (Jan 15, 2025)
└── Analyses
└── Trends
└── Diet Plans
└── Reports
```

#### Modified Sessions Table:
```sql
-- Update existing sessions table
ALTER TABLE sessions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN device_id INTEGER REFERENCES devices(id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- Update ECG data table
ALTER TABLE ecg_data ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_ecg_data_user_id ON ecg_data(user_id);
```

---

### 6. **Historical Trend Analysis**

#### Features:
- **Heart Rate Trends**: Daily, weekly, monthly averages
- **Rhythm Stability**: Track rhythm regularity over time
- **HRV Trends**: Heart rate variability as fitness indicator
- **QRS Morphology Changes**: Detect gradual changes in waveform shape
- **Comparison with Baseline**: Alert on deviations from personal baseline
- **Event Correlation**: Link ECG changes with activities, medications, diet

#### Analytics to Implement:
1. **Time Series Analysis**
   - Heart rate over time (7-day, 30-day, 90-day)
   - Resting HR trends
   - Maximum HR trends
   - HR recovery trends

2. **Anomaly Detection**
   - Sudden rhythm changes
   - New arrhythmias
   - Morphology deviations
   - Statistical outliers

3. **Progression Tracking**
   - Improvement indicators (for recovering patients)
   - Deterioration warnings
   - Medication effectiveness

#### Database Schema:
```sql
CREATE TABLE trend_analysis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    analysis_period VARCHAR(20), -- daily, weekly, monthly
    start_date DATE,
    end_date DATE,
    
    -- Calculated metrics
    avg_heart_rate DECIMAL(5,2),
    min_heart_rate INTEGER,
    max_heart_rate INTEGER,
    heart_rate_variability DECIMAL(5,2),
    
    -- Rhythm statistics
    normal_rhythm_percentage DECIMAL(5,2),
    abnormal_episodes_count INTEGER,
    
    -- Comparison with baseline
    deviation_from_baseline DECIMAL(5,2),
    significant_changes TEXT[],
    
    -- Health score
    cardiac_health_score INTEGER, -- 0-100 scale
    
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE health_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id),
    
    alert_type VARCHAR(50), -- baseline_deviation, new_arrhythmia, significant_change
    severity VARCHAR(20), -- low, medium, high, critical
    title VARCHAR(200),
    description TEXT,
    recommendation TEXT,
    
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 7. **Personalized Diet Plan Generator**

#### Input Factors:
1. **ECG Analysis Results**
   - Current cardiac health status
   - Detected abnormalities
   - Risk level

2. **Medical History**
   - Hypertension → low sodium diet
   - High cholesterol → low fat diet
   - Diabetes → low sugar diet
   - Heart failure → fluid restriction

3. **Personal Factors**
   - Age, gender, weight
   - Activity level
   - Food allergies/preferences
   - Cultural dietary restrictions

#### Diet Plan Features:
- **Weekly meal plans** (7 days, 3 meals + 2 snacks)
- **Cardiac-healthy recipes** with full nutrition info
- **Shopping lists** auto-generated
- **Calorie and macro tracking**
- **Sodium/fat/sugar limits** based on condition
- **Hydration tracking**
- **Supplement recommendations** (Omega-3, CoQ10, Magnesium)

#### Dietary Guidelines by Condition:
```
Heart Disease General:
- Sodium: <2000mg/day
- Saturated fat: <7% of calories
- Trans fat: 0g
- Fiber: 25-30g/day
- Omega-3: 1-2g/day

Hypertension (High BP):
- Sodium: <1500mg/day
- DASH diet principles
- Potassium-rich foods
- Limit caffeine

High Cholesterol:
- Saturated fat: <5% of calories
- Increase soluble fiber
- Plant sterols/stanols
- Limit dietary cholesterol

Heart Failure:
- Fluid restriction: 1.5-2L/day
- Sodium: <2000mg/day
- Small, frequent meals
- Limit caffeine
```

#### Database Schema:
```sql
CREATE TABLE diet_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(200),
    start_date DATE,
    end_date DATE,
    
    -- Dietary goals
    daily_calorie_target INTEGER,
    sodium_limit_mg INTEGER,
    saturated_fat_limit_g DECIMAL(5,2),
    sugar_limit_g DECIMAL(5,2),
    protein_target_g DECIMAL(5,2),
    fiber_target_g DECIMAL(5,2),
    
    -- Based on condition
    condition_based_on TEXT[], -- hypertension, high_cholesterol, etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    diet_plan_id INTEGER REFERENCES diet_plans(id) ON DELETE CASCADE,
    day_number INTEGER, -- 1-7 for week
    meal_type VARCHAR(20), -- breakfast, lunch, dinner, snack1, snack2
    
    -- Meal details
    meal_name VARCHAR(200),
    description TEXT,
    recipe_instructions TEXT,
    ingredients JSONB, -- [{name, quantity, unit}]
    
    -- Nutrition facts
    calories INTEGER,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fat_g DECIMAL(5,2),
    saturated_fat_g DECIMAL(5,2),
    sodium_mg INTEGER,
    fiber_g DECIMAL(5,2),
    sugar_g DECIMAL(5,2),
    
    -- Tags
    is_heart_healthy BOOLEAN DEFAULT TRUE,
    is_diabetic_friendly BOOLEAN DEFAULT FALSE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meal_tracking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    meal_id INTEGER REFERENCES meals(id),
    scheduled_date DATE,
    consumed BOOLEAN DEFAULT FALSE,
    consumed_at TIMESTAMP,
    portion_size DECIMAL(5,2), -- multiplier, 1.0 = full portion
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nutrition_daily_summary (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE UNIQUE,
    
    total_calories INTEGER,
    total_protein_g DECIMAL(5,2),
    total_carbs_g DECIMAL(5,2),
    total_fat_g DECIMAL(5,2),
    total_sodium_mg INTEGER,
    total_fiber_g DECIMAL(5,2),
    
    within_sodium_limit BOOLEAN,
    within_calorie_target BOOLEAN,
    compliance_score INTEGER, -- 0-100
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 8. **Customer Dashboard Design**

#### Dashboard Sections:

**1. Overview Panel**
- Current cardiac health score (0-100)
- Days since last ECG recording
- Active alerts/warnings
- Medication reminders
- Today's diet compliance

**2. ECG Timeline**
- Visual timeline of all ECG recordings
- Click to view any past session
- Color-coded by health status
- Trend line overlay

**3. Vital Statistics**
- Heart rate: Current vs. 7-day avg vs. 30-day avg
- Heart rate variability trends
- Resting HR chart
- Comparison with personal baseline

**4. Trend Graphs**
- Heart rate over time (interactive chart)
- Rhythm regularity percentage
- Detection frequency of abnormalities
- HRV trends (fitness indicator)

**5. Comparison View**
- Side-by-side: Current ECG vs. Baseline
- Difference highlighting
- Change summary
- Clinical significance indicator

**6. Diet & Nutrition**
- Current week's meal plan
- Today's meals with checkbox
- Nutrition summary (calories, sodium, fat)
- Shopping list
- Compliance tracker

**7. Health Insights**
- AI-generated health tips
- Medication reminders
- Exercise recommendations
- Sleep quality correlation
- Stress level tracking

**8. Reports**
- Monthly summary PDFs
- Progress reports
- Shareable reports for doctors
- Export data option

---

## 🔐 Security & Privacy Considerations

### Data Protection:
- **Encryption at rest**: All medical data encrypted in database
- **Encryption in transit**: HTTPS/TLS for all communications
- **Access control**: Role-based permissions
- **Audit logging**: Track all data access
- **Data retention**: User-controlled data deletion
- **HIPAA compliance** (if targeting US market)
- **GDPR compliance** (if targeting EU)

### Authentication Security:
- Password hashing (bcrypt with salt)
- JWT tokens with expiration
- Refresh token rotation
- Rate limiting on login attempts
- Account lockout after failed attempts
- Suspicious activity detection

---

## 📊 Business Logic Implementation

### Subscription Tiers (Optional):
```
Basic Plan ($9.99/month):
- Unlimited ECG recordings
- Basic analysis
- 6 months data retention
- Weekly diet plans

Pro Plan ($19.99/month):
- Everything in Basic
- Historical trend analysis
- Personalized diet plans
- 2 years data retention
- Email alerts
- Export reports

Premium Plan ($29.99/month):
- Everything in Pro
- AI-powered insights
- Doctor consultation portal
- Lifetime data retention
- Priority support
- Family sharing (up to 4 devices)
```

---

## 🚀 Implementation Priority

### Phase 1: Core Authentication (Week 1-2)
1. User registration/login
2. Device activation system
3. Basic profile management
4. Database schema setup

### Phase 2: Medical History & Baseline (Week 3-4)
1. Medical history questionnaire
2. Previous ECG upload
3. Baseline establishment
4. Data isolation implementation

### Phase 3: Enhanced ECG System (Week 5-6)
1. User-specific session storage
2. Device-user authentication
3. Historical data comparison
4. Trend analysis algorithms

### Phase 4: Diet & Recommendations (Week 7-8)
1. Diet plan generator
2. Meal database
3. Nutrition tracking
4. Compliance monitoring

### Phase 5: Dashboard & Reporting (Week 9-10)
1. Customer dashboard
2. Trend visualizations
3. PDF report generation
4. Alert system

---

## 📝 Legal Requirements

### Required Documents:
1. **Terms of Service**
2. **Privacy Policy** (HIPAA/GDPR compliant)
3. **Medical Disclaimer**: "Not for emergency use, not FDA approved for diagnosis"
4. **Informed Consent**: Users acknowledge limitations
5. **Return Policy**
6. **Warranty Information**

### Disclaimers to Include:
- Not a replacement for professional medical care
- Not for emergency situations (call 911 for chest pain)
- Device accuracy limitations
- Consult doctor before making medical decisions
- Diet plans are suggestions, not prescriptions

---

## 💰 Cost Estimation

### Development Costs:
- Backend development: 200-300 hours
- Frontend development: 150-200 hours
- ML/Analysis algorithms: 100-150 hours
- Testing & QA: 100 hours
- **Total**: ~$25,000-$40,000 (at $50-80/hour)

### Ongoing Costs:
- Cloud hosting: $50-200/month (scales with users)
- Database: $30-100/month
- Email service: $10-50/month
- SSL certificates: $50-100/year
- Domain: $15/year

---

## 📱 Mobile App Consideration

Future expansion: Build iOS/Android apps with:
- Push notifications for alerts
- Mobile ECG monitoring
- Quick diet logging
- Medication reminders
- Emergency contact quick dial

---

This is a comprehensive commercial-grade system that provides real value to customers. Would you like me to start implementing Phase 1 (Authentication & Device Registration) right now?
