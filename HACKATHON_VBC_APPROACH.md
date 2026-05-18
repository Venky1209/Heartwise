# HeartWise: Value-Based Care Hackathon Approach

## Problem Statement 
**"Healthcare Value-Based Care Analytics: Provide real-time dashboards to track quality metrics, spot care gaps, and improve outcomes at population level."**

---

## 1. Our Core Pitch (The "Why")
Healthcare is shifting from **Fee-for-Service** (getting paid per visit) to **Value-Based Care (VBC)** (getting paid to keep people healthy). The most expensive failures in VBC are unexpected cardiac events (heart attacks, strokes) because they lead to massive ER bills and poor patient outcomes.

**HeartWise** solves this by acting as a proactive *Population Health Command Center*. Instead of waiting for a patient to show up in the ER, HeartWise uses IoT (ESP32) and AI to predict and stratify cardiac risk in real-time, allowing doctors to intervene early, close care gaps, and dramatically improve cohort outcomes.

---

## 2. How We Meet the Requirements

### A. Real-Time Dashboards
*   **What we built:** The "Population Health Dashboard" (formerly Doctor Dashboard).
*   **How it works:** A React-based command center displaying real-time aggregated metrics—how many patients are critical, what percentage of the assigned cohort is improving, and live ECG streaming data.

### B. Track Quality Metrics
*   **What we built:** Custom Risk Scoring System & Vital Tracking
*   **How it works:** The Postgres database continuously calculates a comprehensive `overall_score` (0-100) combining ECU metrics (HRV, BPM), lifestyle (BMI, smoking), and demographics. The `calculate_risk_trend` algorithm tracks if a patient's outcomes are improving or worsening over 30 and 90-day intervals.

### C. Spot Care Gaps
*   **What we built:** Automated Care Gap Flagging
*   **How it works:** A Care Gap occurs when a patient stops engaging with their health or their vitals deteriorate unexpectedly. HeartWise uses automated SQL triggers (`trigger_critical_risk_alert`) to immediately alert the doctor if a patient misses their routine ECG recordings or drops into a "Critical" predictive risk bracket.

### D. Improve Outcomes at Population Level
*   **What we built:** Cohort Risk Stratification
*   **How it works:** Doctors can't review 500 individual patients daily. HeartWise automatically groups the doctor's assigned population into Low, Moderate, High, and Critical risk tiers via the `v_user_risk_dashboard` analytical view. This allows the doctor to intervene on the highest-risk 5% of their population first.

---

## 3. The Technical Architecture (What we are executing)

To win this hackathon, our technical architecture is split into two connected layers:

### The Macro View (Population Analytics)
- **Population Analytics SQL View:** Real-time mathematical aggregation of risk scores exclusively for the patients assigned to the active doctor.
- **Care Gaps Tracker UI:** A widget that highlights non-compliant or deteriorating patients so that immediate clinical instructions can be issued.

### The Micro View (Clinical Report & Workflow)
- **Patient Cohort Builder:** An interface where doctors can browse unassigned patients and "claim" them into their managed population.
- **Deep-Dive Clinical Viewer:** When a Care Gap is identified, the doctor clicks the patient to view their AI-generated diagnostic ECG reports and historical trendlines, seamlessly leading to prescription issuance.

---

## 4. Winning Strategy & Presentation Flow

When presenting to the judges, follow this structure:
1. **The Hook:** Define Value-Based care (saving money by preventing hospitalization). Mention that Cardiac issues are the #1 cost driver.
2. **The IoT Connection:** Show the ESP32 setup briefly—explain that high-fidelity data is required to predict risk.
3. **The AI Analytics:** Show how the ML pipeline takes raw data and turns it into a measurable "Quality Metric" (Risk Score).
4. **The Population Dashboard:** Present the Doctor UI. Point directly to the **Care Gaps** widget and explain how HeartWise automatically finds patients slipping through the cracks.
5. **The Clinical Action:** Show how a doctor claims a patient, reviews their report, and intervenes *before* a heart attack happens, fulfilling the exact requirement of the hackathon prompt.
