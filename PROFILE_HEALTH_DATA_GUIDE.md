# Profile Health Data Integration Guide

## Overview
The HeartWise profile system now captures comprehensive health information to enable:
1. **Personalized Diet Recommendations** - Based on medical conditions, allergies, and dietary restrictions
2. **ECG Baseline Comparison** - Compare current readings with historical baselines
3. **Weekly Abnormality Analysis** - Track changes and detect patterns over time
4. **Risk Assessment** - Calculate cardiac risk scores using complete health profile

---

## 📋 Profile Data Structure

### 1. Personal Information
**Location**: Personal Info Tab

```javascript
{
  firstName, lastName, dateOfBirth, gender,
  heightCm, weightKg, bloodType, phone,
  address: { line1, line2, city, state, postalCode, country },
  emergencyContact: { name, phone, relationship },
  timezone, language
}
```

**Uses**:
- BMI calculation for diet recommendations
- Age-based cardiac risk assessment
- Emergency contact for critical alerts

---

### 2. Medical History
**Location**: Medical History Tab
**Database**: `medical_history` table

#### A. Cardiac History
```sql
previous_heart_attack BOOLEAN
heart_attack_date DATE
previous_angina BOOLEAN
previous_arrhythmia BOOLEAN
arrhythmia_type VARCHAR(100)
previous_heart_failure BOOLEAN
previous_stroke BOOLEAN
family_cardiac_history BOOLEAN
family_cardiac_details TEXT
```

**Use Cases**:
- ✅ **Diet Recommendations**: Restrict sodium for heart failure patients
- ✅ **Risk Scoring**: Higher risk with multiple cardiac events
- ✅ **ECG Interpretation**: Context for abnormal readings

#### B. Cardiac Procedures & Treatments
```sql
cardiac_procedures TEXT[]  -- Array of procedures
last_cardiac_event_date DATE
pacemaker BOOLEAN
pacemaker_type VARCHAR(100)
icd_implanted BOOLEAN
```

**Stored Procedures Examples**:
- Coronary Artery Bypass Grafting (CABG)
- Percutaneous Coronary Intervention (PCI/Stent)
- Angioplasty
- Heart Valve Replacement
- Catheter Ablation
- Pacemaker Implantation
- ICD Implantation

**Use Cases**:
- ✅ **Diet Recommendations**: Post-surgery dietary guidelines
- ✅ **ECG Comparison**: Account for pacemaker rhythms
- ✅ **Activity Recommendations**: Exercise limitations post-procedure

#### C. Risk Factors
```sql
has_hypertension BOOLEAN
hypertension_diagnosed_date DATE
has_diabetes BOOLEAN
diabetes_type VARCHAR(20)  -- type1, type2, gestational
has_high_cholesterol BOOLEAN
cholesterol_level DECIMAL(5,2)
smoker VARCHAR(20)  -- never, former, current
smoking_pack_years INTEGER
quit_smoking_date DATE
alcohol_consumption VARCHAR(30)  -- none, occasional, moderate, heavy
```

**Use Cases**:
- ✅ **Diet Recommendations**: 
  - Diabetic: Low glycemic index foods, controlled carbs
  - Hypertension: DASH diet, low sodium
  - High cholesterol: Low saturated fat, high fiber
- ✅ **Risk Assessment**: Calculate 10-year cardiac risk score
- ✅ **Trend Analysis**: Monitor if ECG changes correlate with lifestyle changes

#### D. Current Vital Signs
```sql
resting_heart_rate INTEGER
blood_pressure_systolic INTEGER
blood_pressure_diastolic INTEGER
bmi DECIMAL(4,2)
```

**Use Cases**:
- ✅ **ECG Baseline**: Compare current HR with resting baseline
- ✅ **Diet Recommendations**: Weight management plans based on BMI
- ✅ **Trend Detection**: Alert if HR deviates significantly from baseline

#### E. Lifestyle Factors
```sql
exercise_frequency VARCHAR(30)  -- sedentary, light, moderate, active, very_active
diet_type VARCHAR(50)  -- mediterranean, vegetarian, vegan, standard
sleep_hours_avg DECIMAL(3,1)
has_sleep_apnea BOOLEAN
```

**Use Cases**:
- ✅ **Diet Recommendations**: Align with current dietary preferences
- ✅ **Activity Plans**: Gradual exercise progression
- ✅ **Sleep Analysis**: Correlate poor sleep with ECG abnormalities

#### F. Additional Conditions
```sql
has_kidney_disease BOOLEAN
has_lung_disease BOOLEAN
has_thyroid_disorder BOOLEAN
other_conditions TEXT[]
```

**Use Cases**:
- ✅ **Diet Recommendations**: 
  - Kidney disease: Potassium/phosphorus restrictions
  - Thyroid: Iodine considerations
- ✅ **Medication Interactions**: Check for contraindications

#### G. Allergies & Dietary Restrictions
```sql
allergies TEXT[]  -- Food, medication allergies
dietary_restrictions TEXT[]  -- Gluten-free, lactose-free, etc.
```

**Use Cases**:
- ✅ **Diet Recommendations**: CRITICAL - Exclude allergens
- ✅ **Medication Safety**: Avoid allergenic medications

---

### 3. Medications
**Location**: Medications Tab
**Database**: `medications` table

```sql
medication_name VARCHAR(200)
generic_name VARCHAR(200)
medication_class VARCHAR(100)  -- beta_blocker, ace_inhibitor, statin
dosage VARCHAR(100)
frequency VARCHAR(100)
start_date DATE
end_date DATE
is_current BOOLEAN
```

**Medication Classes for Cardiac Patients**:
- Beta Blockers (metoprolol, atenolol)
- ACE Inhibitors (lisinopril, enalapril)
- Statins (atorvastatin, simvastatin)
- Blood Thinners (warfarin, apixaban)
- Diuretics (furosemide, hydrochlorothiazide)
- Antiplatelet (aspirin, clopidogrel)

**Use Cases**:
- ✅ **Diet Recommendations**: 
  - Warfarin: Avoid vitamin K-rich foods
  - Statins: Avoid grapefruit
  - Diuretics: Monitor potassium intake
- ✅ **Drug-Food Interactions**: Alert for dangerous combinations
- ✅ **Compliance Tracking**: Ensure medication adherence

---

### 4. Baseline ECGs
**Location**: Baseline ECGs Tab
**Database**: `baseline_ecgs` table

```sql
recording_date DATE
recording_facility VARCHAR(200)
performing_physician VARCHAR(200)

-- ECG Parameters
heart_rate INTEGER
pr_interval INTEGER  -- ms
qrs_duration INTEGER  -- ms
qt_interval INTEGER  -- ms
qtc_interval INTEGER  -- Corrected QT
p_wave_present BOOLEAN
qrs_morphology VARCHAR(100)
st_segment VARCHAR(50)
t_wave_morphology VARCHAR(50)

-- Clinical Data
interpretation TEXT
abnormalities_detected TEXT
purpose TEXT  -- Routine, Pre-op, Post-event
is_active_baseline BOOLEAN  -- Used for comparisons

-- File Storage
file_path VARCHAR(500)
file_type VARCHAR(10)  -- PDF, JPEG, PNG
```

**ECG Parameters Explained**:
- **Heart Rate**: Baseline BPM for comparison
- **PR Interval**: AV node conduction time (normal: 120-200ms)
- **QRS Duration**: Ventricular depolarization (normal: <120ms)
- **QT/QTc Interval**: Repolarization time (prolonged = risk of arrhythmia)
- **ST Segment**: Elevation/depression indicates ischemia
- **T Wave**: Inversion may indicate cardiac stress

**Use Cases**:
- ✅ **Weekly Abnormality Detection**: Compare current ECG with active baseline
- ✅ **Trend Analysis**: Track changes over time
- ✅ **Clinical Context**: Understand patient's normal vs abnormal patterns
- ✅ **AI Model Training**: Use historical data to personalize ML models

---

## 🎯 Integration with Features

### 1. Diet Recommendations System
**File**: `backend/routes/diet.js`

#### Data Inputs:
```javascript
// From medical_history
const conditions = {
  diabetes: user.has_diabetes,
  hypertension: user.has_hypertension,
  highCholesterol: user.has_high_cholesterol,
  kidneyDisease: user.has_kidney_disease
};

// From user_profiles
const physicalData = {
  heightCm: profile.height_cm,
  weightKg: profile.weight_kg,
  bmi: calculateBMI(weight, height)
};

// From medications
const drugInteractions = medications
  .filter(m => m.is_current)
  .map(m => m.medication_class);

// From medical_history
const restrictions = {
  allergies: history.allergies,
  dietary: history.dietary_restrictions
};
```

#### Diet Generation Logic:
```javascript
function generateDietPlan(userData) {
  let recommendations = [];
  
  // Hypertension - DASH Diet
  if (userData.conditions.hypertension) {
    recommendations.push({
      guideline: "Low Sodium Diet",
      maxSodium: "1500mg/day",
      foods: ["Leafy greens", "Berries", "Oats", "Fatty fish"],
      avoid: ["Processed meats", "Canned soups", "Fast food"]
    });
  }
  
  // Diabetes - Low Glycemic Index
  if (userData.conditions.diabetes) {
    recommendations.push({
      guideline: "Low GI Diet",
      carbs: "45-60g per meal",
      foods: ["Quinoa", "Sweet potato", "Legumes", "Non-starchy vegetables"],
      avoid: ["White bread", "Sugary drinks", "Candy"]
    });
  }
  
  // High Cholesterol - Heart-Healthy
  if (userData.conditions.highCholesterol) {
    recommendations.push({
      guideline: "Heart-Healthy Diet",
      saturatedFat: "<7% of calories",
      foods: ["Salmon", "Avocado", "Nuts", "Olive oil", "Oatmeal"],
      avoid: ["Fried foods", "Butter", "Red meat", "Full-fat dairy"]
    });
  }
  
  // Kidney Disease - Renal Diet
  if (userData.conditions.kidneyDisease) {
    recommendations.push({
      guideline: "Renal Diet",
      maxPotassium: "2000mg/day",
      maxPhosphorus: "1000mg/day",
      avoid: ["Bananas", "Oranges", "Tomatoes", "Dairy"]
    });
  }
  
  // Remove allergens
  recommendations = filterAllergens(recommendations, userData.restrictions.allergies);
  
  // Consider drug interactions
  if (userData.medications.includes('warfarin')) {
    recommendations.push({
      warning: "Warfarin Interaction",
      note: "Maintain consistent vitamin K intake",
      moderate: ["Spinach", "Kale", "Broccoli"]
    });
  }
  
  return recommendations;
}
```

---

### 2. ECG Comparison & Abnormality Detection
**File**: `backend/routes/analysis.js`

#### Comparison Algorithm:
```javascript
async function detectAbnormalities(currentECG, userId) {
  // 1. Get active baseline ECG
  const baseline = await pool.query(
    'SELECT * FROM baseline_ecgs WHERE user_id = $1 AND is_active_baseline = TRUE',
    [userId]
  );
  
  if (!baseline.rows[0]) {
    return { hasBaseline: false, analysis: 'No baseline for comparison' };
  }
  
  const base = baseline.rows[0];
  const current = currentECG;
  
  // 2. Compare key parameters
  const deviations = {
    heartRate: {
      baseline: base.heart_rate,
      current: current.averageHeartRate,
      deviation: Math.abs(current.averageHeartRate - base.heart_rate),
      threshold: 20,  // BPM
      abnormal: Math.abs(current.averageHeartRate - base.heart_rate) > 20
    },
    prInterval: {
      baseline: base.pr_interval,
      current: current.prInterval,
      deviation: Math.abs(current.prInterval - base.pr_interval),
      threshold: 40,  // ms
      abnormal: Math.abs(current.prInterval - base.pr_interval) > 40
    },
    qrsDuration: {
      baseline: base.qrs_duration,
      current: current.qrsDuration,
      deviation: Math.abs(current.qrsDuration - base.qrs_duration),
      threshold: 20,  // ms
      abnormal: Math.abs(current.qrsDuration - base.qrs_duration) > 20
    },
    qtcInterval: {
      baseline: base.qtc_interval,
      current: current.qtcInterval,
      deviation: Math.abs(current.qtcInterval - base.qtc_interval),
      threshold: 60,  // ms (>500ms = dangerous)
      abnormal: Math.abs(current.qtcInterval - base.qtc_interval) > 60 || current.qtcInterval > 500
    }
  };
  
  // 3. Generate clinical insights
  const abnormalities = [];
  
  if (deviations.heartRate.abnormal) {
    abnormalities.push({
      type: 'Heart Rate Deviation',
      severity: deviations.heartRate.deviation > 40 ? 'high' : 'medium',
      message: `Heart rate ${current.averageHeartRate} BPM differs significantly from baseline ${base.heart_rate} BPM`,
      recommendation: 'Monitor for symptoms. Consult physician if persistent.'
    });
  }
  
  if (deviations.qtcInterval.abnormal) {
    abnormalities.push({
      type: 'QTc Prolongation',
      severity: 'high',
      message: 'Corrected QT interval is prolonged, increasing risk of arrhythmia',
      recommendation: 'URGENT: Consult cardiologist. Review medications.'
    });
  }
  
  // 4. Consider medical history for context
  const history = await getMedicalHistory(userId);
  
  if (history.previous_arrhythmia && deviations.heartRate.abnormal) {
    abnormalities.push({
      type: 'Arrhythmia History Alert',
      severity: 'medium',
      message: 'Deviation detected in patient with known arrhythmia history',
      recommendation: 'Continue monitoring. Document any symptoms.'
    });
  }
  
  return {
    hasBaseline: true,
    baseline: base,
    current: current,
    deviations: deviations,
    abnormalities: abnormalities,
    riskScore: calculateRiskScore(deviations, history)
  };
}
```

---

### 3. Weekly Summary Analysis
**File**: `backend/routes/analysis.js` → Weekly Trend Detection

```javascript
async function generateWeeklySummary(userId, startDate, endDate) {
  // 1. Get all ECG sessions in date range
  const sessions = await pool.query(
    `SELECT * FROM ecg_sessions 
     WHERE user_id = $1 AND start_time BETWEEN $2 AND $3 
     ORDER BY start_time ASC`,
    [userId, startDate, endDate]
  );
  
  // 2. Get baseline for comparison
  const baseline = await getActiveBaseline(userId);
  
  // 3. Analyze trends
  const heartRates = sessions.rows.map(s => s.average_heart_rate);
  const avgHR = heartRates.reduce((a, b) => a + b, 0) / heartRates.length;
  
  const trends = {
    averageHeartRate: avgHR,
    baselineDeviation: baseline ? Math.abs(avgHR - baseline.heart_rate) : null,
    trend: detectTrend(heartRates),  // 'increasing', 'decreasing', 'stable'
    variability: calculateVariability(heartRates)
  };
  
  // 4. Get medical context
  const history = await getMedicalHistory(userId);
  const medications = await getCurrentMedications(userId);
  
  // 5. Generate insights
  const insights = [];
  
  if (trends.trend === 'increasing' && history.has_hypertension) {
    insights.push({
      type: 'warning',
      message: 'Increasing heart rate trend detected. Hypertension may be poorly controlled.',
      action: 'Review blood pressure medications with physician.'
    });
  }
  
  if (medications.some(m => m.medication_class === 'beta_blocker') && trends.averageHeartRate > 80) {
    insights.push({
      type: 'alert',
      message: 'Heart rate elevated despite beta blocker therapy',
      action: 'Medication dosage may need adjustment.'
    });
  }
  
  // 6. Diet recommendations based on trends
  if (trends.variability > threshold) {
    insights.push({
      type: 'diet',
      message: 'High heart rate variability detected',
      recommendation: 'Increase intake of magnesium and potassium-rich foods (if not on potassium-sparing diuretics)'
    });
  }
  
  return {
    period: { start: startDate, end: endDate },
    sessionCount: sessions.rows.length,
    trends: trends,
    insights: insights,
    comparedToBaseline: baseline ? true : false
  };
}
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────┐
│  User Registration  │
│    & Onboarding     │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Profile Complete   │────→ Basic Demographics
│      Wizard         │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Medical History    │────→ Conditions, Risk Factors
│       Form          │      Procedures, Lifestyle
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Medications List   │────→ Current & Past Meds
│                     │      Drug-Food Interactions
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Baseline ECG       │────→ Historical ECG Records
│     Upload          │      Active Baseline Selection
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Health Profile    │
│     COMPLETE        │
└──────────┬──────────┘
           │
           ├──────────→ Diet Recommendation Engine
           │            └─→ Personalized Meal Plans
           │
           ├──────────→ ECG Analysis Service
           │            └─→ Abnormality Detection
           │
           ├──────────→ Weekly Trend Analysis
           │            └─→ Health Insights
           │
           └──────────→ Risk Score Calculator
                        └─→ Cardiac Risk Assessment
```

---

## 🔒 Security & Privacy

### Data Encryption
- All health data encrypted at rest (AES-256)
- TLS 1.3 for data in transit
- HIPAA-compliant data handling

### Access Control
```javascript
// All profile routes protected
router.get('/profile', authenticateToken, async (req, res) => {
  // Only user can access their own profile
  const userId = req.user.userId;
  // ...
});
```

### Data Retention
- Medical history: Indefinite (unless user requests deletion)
- ECG sessions: 7 years (regulatory compliance)
- Baseline ECGs: Indefinite (clinical reference)

---

## 🚀 Next Steps

### Phase 1: Current Implementation ✅
- [x] Profile data capture
- [x] Medical history storage
- [x] Medications tracking
- [x] Baseline ECG upload
- [x] UI for data display

### Phase 2: Integration (In Progress)
- [ ] Diet recommendation API integration
- [ ] ECG comparison algorithm
- [ ] Weekly trend analysis
- [ ] Risk score calculation

### Phase 3: Advanced Features (Planned)
- [ ] AI-powered diet optimization
- [ ] Predictive abnormality detection
- [ ] Telemedicine integration
- [ ] Family health history tree
- [ ] Genetic risk factors

---

## 📱 User Guide Summary

### For Patients:
1. **Complete Your Profile** - Fill out personal info and emergency contacts
2. **Add Medical History** - Document all cardiac conditions, procedures, and risk factors
3. **List Medications** - Keep current medications up-to-date for safety
4. **Upload Baseline ECGs** - Provide previous ECG reports for comparison
5. **Review Diet Plan** - Get personalized nutrition recommendations
6. **Monitor Weekly** - Check weekly summaries for health trends

### For Healthcare Providers:
1. **Review Patient Profile** - Comprehensive view of medical history
2. **Analyze ECG Trends** - Compare current readings with baselines
3. **Adjust Medications** - Based on ECG analysis and symptoms
4. **Provide Diet Guidance** - Use system-generated recommendations
5. **Track Compliance** - Monitor medication adherence and lifestyle changes

---

## 📞 Support

For questions about profile data integration:
- **Technical**: Check `backend/routes/profile.js`
- **Database**: See `database/commercial_schema.sql`
- **UI Components**: Refer to `frontend/src/pages/Profile.js`

---

**Last Updated**: October 3, 2025
**Version**: 2.0.0
**Maintained by**: HeartWise Development Team
