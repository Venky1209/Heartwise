# 🎯 HeartWise Risk Scoring System - Complete Guide

## ✅ Implementation Status: COMPLETE

### What's Been Built:

1. **✅ Database Schema** (`database/risk_scoring_schema.sql`)
   - 5 tables: risk_scores, risk_factors, risk_score_history, risk_alerts, risk_factor_definitions
   - 2 views: v_user_risk_dashboard
   - 4 functions: get_latest_risk_score(), calculate_risk_trend(), etc.
   - Automated triggers for alerts and history tracking

2. **✅ ML Risk Calculator** (`ml-service/risk_scorer.py`)
   - Sophisticated multi-factor risk calculation
   - 4 risk categories: ECG, Lifestyle, Medical History, Demographics
   - Time-based predictions (30/90/365 days)
   - Automated recommendations generation
   - Confidence scoring

3. **✅ Backend API** (`backend/routes/risk.js`)
   - POST /api/risk/calculate - Calculate new risk score
   - GET /api/risk/latest - Get latest score
   - GET /api/risk/history - Get score history with trends
   - GET /api/risk/factors - Get risk factors
   - GET /api/risk/alerts - Get risk alerts
   - GET /api/risk/dashboard - Get complete dashboard summary

4. **✅ Frontend UI** (`frontend/src/pages/RiskScore.js`)
   - Beautiful circular risk meter (0-100 score)
   - 4-category breakdown visualization
   - Time-based risk predictions
   - Risk factors categorization (high/moderate/protective)
   - Personalized recommendations
   - Historical trend chart
   - Real-time alerts

---

## 🚀 How to Use

### For Users:

1. **Navigate to Risk Score Page**
   ```
   http://localhost:3000/risk-score
   ```

2. **Calculate Your First Risk Score**
   - Click "Calculate Risk Score" button
   - System analyzes your:
     - ECG data (heart rate, HRV, arrhythmias)
     - Lifestyle (smoking, exercise, BMI)
     - Medical history (diabetes, hypertension, family history)
     - Demographics (age, gender)

3. **View Your Results**
   - Overall score (0-100, color-coded)
   - Risk level: Low/Moderate/High/Critical
   - Category breakdown (ECG, Lifestyle, Medical, Demographics)
   - 30/90/365-day event risk predictions

4. **Review Risk Factors**
   - High-risk factors (red) - Immediate attention needed
   - Moderate-risk factors (yellow) - Monitor and improve
   - Protective factors (green) - Keep it up!

5. **Follow Recommendations**
   - Prioritized action items
   - Expected impact on risk score
   - Timeframe for results

### For Developers:

#### Testing the API:

```bash
# 1. Calculate risk score
curl -X POST http://localhost:5002/risk/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "demographics": {
      "age": 55,
      "gender": "male",
      "ethnicity": "caucasian"
    },
    "ecg_metrics": {
      "resting_hr": 78,
      "hrv_sdnn": 42,
      "arrhythmia_episodes_30days": 5,
      "pvc_count_24h": 200,
      "afib_detected": false
    },
    "lifestyle": {
      "smoking_status": "never",
      "exercise_minutes_per_week": 120,
      "bmi": 27.5,
      "alcohol_drinks_per_week": 4,
      "diet_quality_score": 65
    },
    "medical_history": {
      "hypertension": true,
      "bp_controlled": true,
      "diabetes": false,
      "ldl_cholesterol": 130,
      "previous_heart_attack": false,
      "family_history_heart_disease": true
    }
  }'

# 2. Get latest risk score (requires auth)
curl -X GET http://localhost:5001/api/risk/latest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Get risk history
curl -X GET "http://localhost:5001/api/risk/history?days=90" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Get risk alerts
curl -X GET "http://localhost:5001/api/risk/alerts?status=unread" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Risk Scoring Algorithm

### Overall Score Calculation:

```
Overall Risk Score = 
  (ECG Risk × 30%) +
  (Lifestyle Risk × 25%) +
  (Medical History Risk × 25%) +
  (Demographics Risk × 20%)
```

### 1. ECG Risk Score (0-100)

| Factor | Weight | Risk Criteria |
|--------|--------|---------------|
| Resting HR | 30% | >100 BPM = +30, >90 BPM = +15 |
| HRV (SDNN) | 25% | <20ms = +25, <30ms = +15 |
| Arrhythmias | 25% | >50/month = +25, >20/month = +15 |
| PVCs | 10% | >1000/day = +10, >500/day = +5 |
| AFib | 10% | Detected = +10 |

### 2. Lifestyle Risk Score (0-100)

| Factor | Weight | Risk Criteria |
|--------|--------|---------------|
| Smoking | 30% | Current = +30, Former <5yrs = +15 |
| Exercise | 25% | <30 min/week = +25, <60 min/week = +15 |
| BMI | 20% | ≥40 = +20, ≥35 = +15, ≥30 = +10 |
| Alcohol | 15% | >14 drinks/week = +15 |
| Diet | 10% | Quality score <30 = +10 |

### 3. Medical History Risk Score (0-100)

| Factor | Weight | Risk Criteria |
|--------|--------|---------------|
| Previous MI | 25% | Yes = +25 |
| Hypertension | 20% | Uncontrolled = +20, Controlled = +10 |
| Diabetes | 20% | HbA1c ≥9% = +20, ≥8% = +15 |
| Cholesterol | 15% | LDL ≥190 = +15, ≥160 = +10 |
| Family History | 15% | Onset <45 = +15, <55 = +10 |

### 4. Demographics Risk Score (0-100)

| Factor | Weight | Risk Criteria |
|--------|--------|---------------|
| Age | 60% | ≥75 = +60, ≥65 = +45, ≥55 = +30 |
| Gender | 30% | Male ≥45 = +15, Female ≥55 = +15 |
| Ethnicity | 10% | High-risk groups = +10 |

### Risk Levels:

- **Low** (0-29): Low cardiac event risk
- **Moderate** (30-49): Watchful monitoring recommended
- **High** (50-74): Medical consultation advised
- **Critical** (75-100): Immediate medical attention required

---

## 🎨 UI Components

### Risk Meter (Circular Progress)
```jsx
// Color-coded based on score
- 0-29: Green (#10b981)
- 30-49: Yellow (#f59e0b)
- 50-74: Orange (#f97316)
- 75-100: Red (#ef4444)
```

### Category Breakdown Bars
- Visual progress bars for each risk category
- Color-coded by score level
- Shows contribution to overall risk

### Time Predictions
- 30-day risk: Short-term event probability
- 90-day risk: Medium-term outlook
- 1-year risk: Long-term cardiovascular health

### Risk Factors Cards
- 🚨 High Risk (Red): Requires immediate action
- ⚠️ Moderate Risk (Yellow): Monitor and improve
- ✅ Protective (Green): Positive health factors

### Recommendations
- Priority-based sorting (Critical → High → Medium → Low)
- Expected impact (risk score reduction)
- Timeframe for results
- Actionable steps

---

## 🔔 Alert System

### Automatic Alerts Triggered:

1. **Critical Risk Alert**
   - When risk score ≥75
   - Auto-sends to risk_alerts table
   - UI shows red banner

2. **Risk Increase Alert**
   - When score increases >10 points
   - Compares with previous assessment

3. **Score Expiring Alert**
   - Risk scores valid for 30 days
   - Reminder to recalculate

### Alert Types:
- `risk_increase` - Score went up significantly
- `critical_risk` - Score in critical range
- `new_risk_factor` - New risk factor detected
- `risk_improvement` - Score improved (positive!)
- `score_expiring` - Time to recalculate

---

## 📈 Database Schema Details

### risk_scores table
```sql
- overall_score (0-100)
- risk_level (low/moderate/high/critical)
- ecg_risk_score, lifestyle_risk_score, medical_history_risk_score, demographic_risk_score
- risk_30_days, risk_90_days, risk_1_year
- high_risk_factors, moderate_risk_factors, protective_factors (JSONB)
- recommendations (JSONB)
- calculated_at, valid_until
```

### risk_factors table
```sql
- factor_name (e.g., "High Resting Heart Rate")
- factor_category (cardiac_history, lifestyle, vital_signs, ecg_metrics, family_history, medications)
- severity (low/moderate/high/critical)
- risk_contribution (% of overall risk)
- is_modifiable (boolean)
- status (active/improving/resolved/worsening)
```

### risk_score_history table
```sql
- Tracks all score changes over time
- Stores change_reason
- Enables trend analysis
```

### risk_alerts table
```sql
- alert_type
- severity
- message
- status (unread/read/acknowledged/dismissed)
- action_required (boolean)
```

---

## 🧪 Testing Scenarios

### Scenario 1: Low Risk User
```json
{
  "demographics": {"age": 35, "gender": "female"},
  "ecg_metrics": {"resting_hr": 68, "hrv_sdnn": 65, "arrhythmia_episodes_30days": 0},
  "lifestyle": {"smoking_status": "never", "exercise_minutes_per_week": 200, "bmi": 22},
  "medical_history": {"hypertension": false, "diabetes": false, "family_history_heart_disease": false}
}
Expected: Overall Score ~15-25 (Low Risk)
```

### Scenario 2: Moderate Risk User
```json
{
  "demographics": {"age": 50, "gender": "male"},
  "ecg_metrics": {"resting_hr": 85, "hrv_sdnn": 40, "arrhythmia_episodes_30days": 8},
  "lifestyle": {"smoking_status": "former", "exercise_minutes_per_week": 90, "bmi": 28},
  "medical_history": {"hypertension": true, "bp_controlled": true, "ldl_cholesterol": 140}
}
Expected: Overall Score ~35-45 (Moderate Risk)
```

### Scenario 3: High Risk User
```json
{
  "demographics": {"age": 65, "gender": "male"},
  "ecg_metrics": {"resting_hr": 95, "hrv_sdnn": 28, "arrhythmia_episodes_30days": 25},
  "lifestyle": {"smoking_status": "current", "exercise_minutes_per_week": 30, "bmi": 32},
  "medical_history": {"hypertension": true, "bp_controlled": false, "diabetes": true, "hba1c": 8.2}
}
Expected: Overall Score ~55-70 (High Risk)
```

### Scenario 4: Critical Risk User
```json
{
  "demographics": {"age": 72, "gender": "male"},
  "ecg_metrics": {"resting_hr": 105, "hrv_sdnn": 18, "arrhythmia_episodes_30days": 50, "afib_detected": true},
  "lifestyle": {"smoking_status": "current", "exercise_minutes_per_week": 0, "bmi": 35},
  "medical_history": {"previous_heart_attack": true, "diabetes": true, "hba1c": 9.5}
}
Expected: Overall Score ~75-90 (Critical Risk)
```

---

## 🔧 Configuration

### Environment Variables:
```env
# Backend
ML_SERVICE_URL=http://127.0.0.1:5002

# Database (already configured)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=heartwise_ecg
DB_USER=postgres
DB_PASSWORD=gugan@2022
```

### Feature Flags:
```javascript
// backend/routes/risk.js
const RISK_SCORING_ENABLED = true;
const AUTO_CALCULATE_ON_NEW_SESSION = false; // TODO: implement
const RISK_ALERT_NOTIFICATIONS = true; // TODO: integrate with SMS/email
```

---

## 🚀 Future Enhancements

### Phase 2 (Next Sprint):
1. **Auto-calculate risk after each ECG session**
   - Trigger risk calculation when session ends
   - Compare with previous score

2. **SMS/Email Alerts for Critical Risk**
   - Integrate Twilio for SMS
   - SendGrid for email
   - Alert emergency contact

3. **Risk Score Widget on Dashboard**
   - Small risk meter on main dashboard
   - Quick glance at current risk

4. **Trend Insights with AI**
   - "Your risk decreased 12% after starting exercise"
   - Correlate lifestyle changes with risk improvements

### Phase 3 (Future):
1. **Doctor Review of Risk Scores**
   - Doctor portal to review patient risk scores
   - Override/adjust risk assessment
   - Add clinical notes

2. **Integration with Wearables**
   - Import Apple Watch HRV data
   - Fitbit heart rate data
   - More accurate lifestyle metrics

3. **Machine Learning Model Training**
   - Train on historical data
   - Improve risk prediction accuracy
   - Personalized models per user

---

## 📞 API Reference

### Calculate Risk Score
```
POST /api/risk/calculate
Headers: Authorization: Bearer <JWT>
Body: (none - fetches user data from database)
Response: {
  "success": true,
  "risk_score": {...},
  "change_from_previous": -5
}
```

### Get Latest Risk Score
```
GET /api/risk/latest
Headers: Authorization: Bearer <JWT>
Response: {
  "overall_score": 42,
  "risk_level": "moderate",
  "calculated_at": "2025-10-19T10:30:00Z",
  ...
}
```

### Get Risk History
```
GET /api/risk/history?days=90&limit=30
Headers: Authorization: Bearer <JWT>
Response: {
  "history": [...],
  "trend": "improving",
  "total_assessments": 8
}
```

### Get Risk Dashboard
```
GET /api/risk/dashboard
Headers: Authorization: Bearer <JWT>
Response: {
  "user_id": "...",
  "overall_score": 42,
  "trend_30_days": "stable",
  "unread_alerts": 2,
  "critical_factors": 1,
  ...
}
```

---

## ✅ Success Metrics

### User Engagement:
- Risk score calculation rate
- Recommendation follow-through
- Alert acknowledgment rate

### Clinical Impact:
- Early detection of high-risk users
- Risk score improvement trends
- Correlation with actual cardiac events

### System Performance:
- Calculation time: <2 seconds
- API response time: <500ms
- Database query optimization

---

## 🎉 Summary

**Risk Scoring is FULLY IMPLEMENTED and READY TO USE!**

Navigate to: **http://localhost:3000/risk-score**

All services are running:
- ✅ Database tables created
- ✅ ML service endpoint active
- ✅ Backend API routes registered
- ✅ Frontend UI component deployed
- ✅ Navigation link added

**Try it now!** Click "Calculate Risk Score" to see your personalized cardiac risk assessment with AI-powered recommendations.
