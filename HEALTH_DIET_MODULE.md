# Weekly Health Summary & Diet Recommendation System

## Overview
Comprehensive health tracking and personalized nutrition guidance integrated into HeartWise ECG monitoring platform.

## Features Implemented

### 1. Weekly Health Summary
**Backend API:** `/api/health/weekly-summary`

**Features:**
- ✅ Weekly ECG session statistics (total sessions, duration, avg HR, HRV)
- ✅ Heart rate metrics (average, min, max)
- ✅ HRV analysis (SDNN, RMSSD averages)
- ✅ Daily breakdown by date
- ✅ Week-over-week comparison
- ✅ Detected abnormalities count
- ✅ AI-generated health insights

**Health Insights:**
- Heart rate analysis (low/normal/elevated)
- HRV status (excellent/good/low)
- Activity level recommendations
- Trend warnings (significant changes)
- Abnormality alerts

**UI Features:**
- Week navigation (current week, previous weeks)
- Key metrics cards with trend indicators
- Color-coded health insights (success/warning/info)
- Daily breakdown table
- Responsive design

### 2. Diet Recommendations
**Backend API:** `/api/diet/recommendations`

**Features:**
- ✅ Personalized health goals based on conditions
- ✅ Dietary restrictions and guidelines
- ✅ Nutrient focus (prioritize/limit/avoid)
- ✅ Food group recommendations (increase/reduce)
- ✅ Sample meal plans (breakfast/lunch/dinner/snacks)
- ✅ Expert tips
- ✅ Hydration guidance

**Personalization Based On:**
- Medical conditions (hypertension, diabetes, high cholesterol, heart disease)
- Current medications
- Recent heart health metrics (HR, HRV)
- BMI calculation
- Dietary preferences and allergies

**Condition-Specific Recommendations:**

**Hypertension:**
- DASH diet guidance
- Limit sodium to 1500mg/day
- Increase: Leafy greens, potassium-rich foods
- Reduce: Processed foods, canned soups

**High Cholesterol:**
- Omega-3 fatty acids
- Soluble fiber
- Increase: Fatty fish, nuts, seeds
- Reduce: Red meat, trans fats

**Diabetes:**
- Complex carbohydrates
- Stable blood sugar management
- Increase: Whole grains, fiber
- Reduce: Simple sugars, refined carbs

**Heart Disease:**
- Mediterranean diet pattern
- Antioxidants and plant sterols
- Increase: Berries, olive oil
- Limit alcohol

**Sample Meal Plans Include:**
- 4 breakfast options (320-350 cal)
- 4 lunch options (340-480 cal)
- 4 dinner options (360-480 cal)
- 4 snack options (120-180 cal)
- All marked as heart-healthy with descriptions

### 3. Additional APIs
**Monthly Trends:** `/api/health/monthly-trends`
- Weekly aggregated data over 3+ months
- Trend visualization data

**Meal Logging:** `/api/diet/meal-log` (POST)
- Log consumed meals with nutrients
- Track calories, carbs, protein, fats

**Meal History:** `/api/diet/meal-history`
- View past meal logs
- Grouped by date with totals

## Technical Implementation

### Backend
**Files Created:**
- `backend/routes/healthSummary.js` (400+ lines)
- `backend/routes/diet.js` (520+ lines)

**Features:**
- JWT authentication middleware protection
- User-specific data filtering
- Complex SQL aggregations
- AI-powered recommendation engine
- Date range calculations

### Frontend
**Files Created:**
- `frontend/src/pages/WeeklySummary.js` (370+ lines)
- `frontend/src/pages/DietRecommendations.js` (300+ lines)

**Features:**
- React hooks (useState, useEffect)
- API integration via Axios
- Responsive grid layouts
- Heroicons for UI
- Color-coded insights
- Tab navigation for meal types
- Loading states and error handling

**Navigation:**
- Added to Layout sidebar: "Weekly Summary" and "Diet Plan"
- Protected routes in App.js

## How to Use

### 1. Backend Setup
```bash
cd backend
npm start
```

Backend routes:
- GET `/api/health/weekly-summary?weeksAgo=0`
- GET `/api/health/monthly-trends?months=3`
- GET `/api/diet/recommendations`
- POST `/api/diet/meal-log`
- GET `/api/diet/meal-history?days=7`

### 2. Frontend Access
```bash
cd frontend
npm start
```

Pages:
- `/weekly-summary` - View weekly health report
- `/diet` - View personalized diet plan

### 3. Testing

**Test Weekly Summary:**
```bash
# Must be authenticated (include JWT token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/health/weekly-summary
```

**Test Diet Recommendations:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/diet/recommendations
```

## Database Requirements

**Existing Tables Used:**
- `ecg_sessions` - ECG recording data
- `users` - User accounts
- `user_profiles` - Personal info (age, weight, height)
- `medical_history` - Health conditions
- `medications` - Current medications
- `diet_plans` - Active diet plans
- `meals` - Meal logging

**Required Columns:**
- `ecg_sessions`: avg_heart_rate, min_heart_rate, max_heart_rate, hrv_sdnn, hrv_rmssd, detected_conditions
- `user_profiles`: age, gender, height_cm, weight_kg, activity_level
- `medical_history`: has_hypertension, has_diabetes, has_high_cholesterol, has_heart_disease

## Future Enhancements

**Planned:**
1. ✅ Weekly PDF report generation
2. ✅ Push notifications for health alerts
3. ✅ Meal photo upload and recognition
4. ✅ Grocery list generation
5. ✅ Integration with fitness trackers
6. ✅ Social sharing of progress
7. ✅ Nutritionist consultation booking
8. ✅ Recipe database with heart-healthy options

## Benefits

**For Users:**
- 📊 Clear weekly health progress tracking
- 🎯 Personalized diet guidance
- 💡 Actionable health insights
- 🥗 Heart-healthy meal ideas
- 📈 Trend analysis over time

**For Healthcare:**
- 📋 Comprehensive patient reports
- 🔍 Early detection of concerning trends
- 💊 Medication-diet interaction awareness
- 📅 Long-term health monitoring

## Summary

The Weekly Health Summary and Diet Recommendation system provides a complete health tracking and nutrition guidance solution:

- **Automated Analysis:** AI-powered insights from ECG data
- **Personalized Nutrition:** Tailored to medical conditions and metrics
- **User-Friendly:** Beautiful UI with clear visualizations
- **Comprehensive:** Covers all aspects of cardiovascular health
- **Integrated:** Seamlessly works with existing ECG monitoring

This transforms HeartWise from a monitoring tool into a complete heart health management platform! 🎉
