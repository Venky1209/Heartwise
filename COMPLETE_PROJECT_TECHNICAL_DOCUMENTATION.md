# HeartWise ECG Monitoring System
## Complete Technical Documentation

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Hardware Layer (IoT)](#4-hardware-layer-iot)
5. [Backend Server](#5-backend-server)
6. [ML/AI Service](#6-mlai-service)
7. [Frontend Application](#7-frontend-application)
8. [Database Schema](#8-database-schema)
9. [API Documentation](#9-api-documentation)
10. [Features & Modules](#10-features--modules)
11. [File Structure](#11-file-structure)
12. [Setup & Deployment](#12-setup--deployment)

---

## 1. Project Overview

### 1.1 What is HeartWise?

HeartWise is a comprehensive **household ECG monitoring system** designed for continuous cardiac health tracking. It combines IoT hardware (ESP32 + AD8232 sensor), real-time data streaming, AI-powered analysis, and a modern web interface to provide:

- **Real-time ECG monitoring** from home
- **AI-powered arrhythmia detection** using deep learning
- **Personalized health recommendations** including diet plans
- **Risk scoring** for cardiac events
- **Weekly health summaries** with trend analysis
- **AI chatbot** for medical queries

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| 📊 **Real-time ECG** | Live ECG waveform display with 250Hz sampling |
| 🤖 **AI Analysis** | Deep learning classification of cardiac rhythms |
| 💊 **Diet Recommendations** | AI-powered personalized nutrition plans |
| ⚠️ **Risk Scoring** | Predictive cardiac event risk assessment |
| 📈 **Weekly Reports** | Comprehensive health trend analysis |
| 💬 **AI Chatbot** | Medical assistant powered by LLM |
| 👨‍⚕️ **Doctor Dashboard** | Healthcare provider monitoring interface |

### 1.3 Target Users

- **Patients**: Home ECG monitoring with AI insights
- **Doctors**: Remote patient monitoring dashboard
- **Healthcare Systems**: Integration-ready API

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              HEARTWISE SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────┐                                                                │
│  │   ESP32 + AD8232│ ◄─── ECG Electrodes (RA, LA, RL)                              │
│  │   IoT Device    │                                                                │
│  │   (250Hz ADC)   │                                                                │
│  └────────┬────────┘                                                                │
│           │ WebSocket (Real-time)                                                   │
│           ▼                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐               │
│  │                     BACKEND SERVER (Node.js)                     │               │
│  │                         Port: 5001                               │               │
│  │  ┌──────────────────────────────────────────────────────────┐   │               │
│  │  │  Routes:                                                  │   │               │
│  │  │  • /api/auth      - Authentication & JWT                  │   │               │
│  │  │  • /api/sessions  - ECG Session Management                │   │               │
│  │  │  • /api/ecg-data  - Raw ECG Data Storage                  │   │               │
│  │  │  • /api/analysis  - ECG Analysis & ML Integration         │   │               │
│  │  │  • /api/profile   - User Health Profiles                  │   │               │
│  │  │  • /api/diet      - AI Diet Recommendations               │   │               │
│  │  │  • /api/risk      - Cardiac Risk Scoring                  │   │               │
│  │  │  • /api/health-summary - Weekly Reports                   │   │               │
│  │  │  • /api/chat      - AI Medical Chatbot                    │   │               │
│  │  │  • /api/doctor    - Doctor Dashboard API                  │   │               │
│  │  │  • /api/devices   - ESP32 Device Management               │   │               │
│  │  └──────────────────────────────────────────────────────────┘   │               │
│  │                              │                                   │               │
│  │              ┌───────────────┼───────────────┐                   │               │
│  │              ▼               ▼               ▼                   │               │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │               │
│  │  │  PostgreSQL  │  │  Socket.IO   │  │   Axios      │           │               │
│  │  │  Database    │  │  Real-time   │  │  HTTP Client │           │               │
│  │  └──────────────┘  └──────────────┘  └──────┬───────┘           │               │
│  └─────────────────────────────────────────────┼───────────────────┘               │
│                                                │                                    │
│           ┌────────────────────────────────────┼────────────────────────────┐      │
│           ▼                                    ▼                            ▼      │
│  ┌─────────────────┐              ┌─────────────────────┐      ┌─────────────────┐ │
│  │   ML SERVICE    │              │   GOOGLE GEMINI AI  │      │   OLLAMA LLM    │ │
│  │   (Python/Flask)│              │   (Diet/Analysis)   │      │   (Chatbot)     │ │
│  │   Port: 5002    │              │                     │      │   Port: 11434   │ │
│  │                 │              └─────────────────────┘      └─────────────────┘ │
│  │  • ECG Analyzer │                                                               │
│  │  • QRS Detection│                                                               │
│  │  • Deep Learning│                                                               │
│  │  • Risk Scorer  │                                                               │
│  │  • Diet AI      │                                                               │
│  └─────────────────┘                                                               │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        FRONTEND (React.js) - Port: 3000                      │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Pages:                                                              │    │   │
│  │  │  • Dashboard      • ECGMonitor       • Sessions      • Analysis     │    │   │
│  │  │  • Profile        • DietRecommendations              • RiskScore    │    │   │
│  │  │  • WeeklySummary  • DoctorDashboard  • ChatAssistant • Devices      │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Components:                                                         │    │   │
│  │  │  • RealTimeECGChart  • Layout  • Animations  • ChatAssistant        │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Hardware (IoT Layer)

| Component | Specification |
|-----------|---------------|
| **Microcontroller** | ESP32 DevKit V1 (WiFi + Bluetooth) |
| **ECG Sensor** | AD8232 Heart Rate Monitor |
| **ADC Resolution** | 12-bit (0-4095) |
| **Sampling Rate** | 250 Hz |
| **Communication** | WebSocket over WiFi |

### 3.2 Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | Server runtime |
| **Express.js** | REST API framework |
| **Socket.IO** | Real-time bidirectional communication |
| **PostgreSQL** | Primary database |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **Helmet** | Security middleware |

### 3.3 ML/AI Service

| Technology | Purpose |
|------------|---------|
| **Python 3.10+** | ML runtime |
| **Flask** | API server |
| **NumPy/SciPy** | Signal processing |
| **scikit-learn** | ML algorithms |
| **TensorFlow** | Deep learning (optional) |
| **Google Gemini** | AI diet recommendations |
| **Ollama/Llama** | Local LLM chatbot |

### 3.4 Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **React Router** | Navigation |
| **React Query** | Data fetching & caching |
| **TailwindCSS** | Styling |
| **Heroicons** | Icons |
| **Chart.js** | ECG visualization |
| **Socket.IO Client** | Real-time data |
| **react-hot-toast** | Notifications |

---

## 4. Hardware Layer (IoT)

### 4.1 ESP32 + AD8232 Connection

```
┌─────────────────────────────────────────────────────────────┐
│                    HARDWARE WIRING DIAGRAM                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   AD8232 ECG Module              ESP32 DevKit               │
│   ┌─────────────┐               ┌─────────────┐             │
│   │             │               │             │             │
│   │  OUTPUT  ●──┼───────────────┼──● GPIO36   │  (ADC)      │
│   │  LO-     ●──┼───────────────┼──● GPIO2    │  (Leads Off)│
│   │  LO+     ●──┼───────────────┼──● GPIO4    │  (Leads Off)│
│   │  3.3V    ●──┼───────────────┼──● 3.3V     │             │
│   │  GND     ●──┼───────────────┼──● GND      │             │
│   │             │               │             │             │
│   └─────────────┘               └─────────────┘             │
│                                                              │
│   ECG Electrodes:                                            │
│   • RA (Right Arm) - Red                                     │
│   • LA (Left Arm)  - Yellow                                  │
│   • RL (Right Leg) - Green (Reference)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Arduino Code (`arduino/HeartWise_ESP32_READY.ino`)

**Key Functions:**

```cpp
// Configuration
const int SAMPLE_RATE = 250;      // 250 Hz sampling
const int BATCH_SIZE = 25;        // Send 25 samples per batch
const float VOLTAGE_REF = 3.3;    // ESP32 ADC reference

// Main Functions
void setup()           // Initialize WiFi, WebSocket, pins
void loop()            // Main loop - sample ECG, send data
void sampleECG()       // Read ADC, calculate voltage
void sendBatch()       // Send ECG batch via WebSocket
void webSocketEvent()  // Handle server commands

// Data Structure
struct ECGData {
  unsigned long timestamp;
  float voltage;
  bool leadsOff;
  float quality;
};
```

**WebSocket Protocol:**

```json
// ESP32 → Server (ECG Data)
{
  "type": "ecg_batch",
  "deviceId": "HeartWise-ESP32-01-AABBCC",
  "sessionId": "uuid",
  "data": [
    {"timestamp": 1000, "voltage": 1.234, "quality": 0.95},
    {"timestamp": 1004, "voltage": 1.256, "quality": 0.94}
  ]
}

// Server → ESP32 (Commands)
{
  "type": "start_recording",
  "sessionId": "uuid"
}
```

---

## 5. Backend Server

### 5.1 Server Entry Point (`backend/server.js`)

```javascript
// Core Imports
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const WebSocket = require('ws');
const { Pool } = require('pg');

// Route Imports
const authRouter = require('./routes/auth');
const sessionsRouter = require('./routes/sessions');
const ecgDataRouter = require('./routes/ecgData');
const analysisRouter = require('./routes/analysis');
const profileRouter = require('./routes/profile');
const dietRouter = require('./routes/diet');
const riskRouter = require('./routes/risk');
const healthSummaryRouter = require('./routes/healthSummary');
const chatbotRouter = require('./routes/chatbot');
const doctorRouter = require('./routes/doctor');
const devicesRouter = require('./routes/devices');

// Server Configuration
const PORT = 5001;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: {...} });

// Database Pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'heartwise_ecg',
  user: 'postgres',
  password: '***'
});
```

### 5.2 API Routes Overview

| Route File | Endpoint | Description |
|------------|----------|-------------|
| `auth.js` | `/api/auth/*` | User registration, login, JWT tokens |
| `sessions.js` | `/api/sessions/*` | ECG session CRUD operations |
| `ecgData.js` | `/api/ecg-data/*` | Raw ECG data storage/retrieval |
| `analysis.js` | `/api/analysis/*` | ML-powered ECG analysis |
| `profile.js` | `/api/profile/*` | User health profiles |
| `diet.js` | `/api/diet/*` | AI diet recommendations |
| `risk.js` | `/api/risk/*` | Cardiac risk scoring |
| `healthSummary.js` | `/api/health-summary/*` | Weekly reports |
| `chatbot.js` | `/api/chat/*` | AI medical assistant |
| `doctor.js` | `/api/doctor/*` | Doctor dashboard API |
| `devices.js` | `/api/devices/*` | ESP32 device management |

### 5.3 Authentication System (`routes/auth.js`)

```javascript
// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// Core Functions
generateAccessToken(user)     // Create JWT with user data
generateRefreshToken()        // Create refresh token
hashPassword(password)        // bcrypt hashing
verifyPassword(password, hash) // bcrypt verification
authenticateToken(req, res, next) // JWT middleware

// Endpoints
POST /api/auth/register    // New user registration
POST /api/auth/login       // User login
POST /api/auth/refresh     // Refresh JWT token
POST /api/auth/logout      // Invalidate token
GET  /api/auth/me          // Get current user
```

### 5.4 ECG Analysis System (`routes/analysis.js`)

```javascript
// Analysis Types
const ANALYSIS_TYPES = [
  'rhythm',              // Heart rhythm classification
  'morphology',          // Waveform morphology
  'abnormality_detection', // Arrhythmia detection
  'quality_assessment'   // Signal quality check
];

// Hybrid Analysis Flow
1. Fetch ECG data from database
2. Run rule-based QRS detection (Pan-Tompkins)
3. Calculate heart rate & HRV
4. Send to ML service for AI classification
5. Combine results and save to database

// Endpoints
GET  /api/analysis                    // List all analyses
GET  /api/analysis/:id                // Get specific analysis
POST /api/analysis                    // Create analysis
POST /api/analysis/run/:sessionId     // Run analysis on session
POST /api/analysis/hybrid/:sessionId  // Hybrid ML+Rule analysis
```

### 5.5 Diet Recommendation System (`routes/diet.js`)

```javascript
// AI Provider: Google Gemini 2.0 Flash
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialization
function initializeGemini() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

// Data Collection for AI
- User profile (age, gender, height, weight, BMI)
- Medical history (hypertension, diabetes, cholesterol)
- Current medications
- ECG timeline (last 30 days heart rate trends)

// AI Prompt Structure
"You are a certified nutritionist specializing in cardiovascular health.
Return ONLY valid JSON with:
- goals, restrictions, nutrients
- foodGroups (increase/reduce)
- mealPlan (breakfast/lunch/dinner/snacks)
- tips, waterIntake"

// Fallback: Rule-Based Recommendations
- Hypertension → DASH diet, limit sodium
- Diabetes → Complex carbs, limit sugar
- High Cholesterol → Omega-3s, limit saturated fats
```

### 5.6 Risk Scoring System (`routes/risk.js`)

```javascript
// Risk Categories (Weighted)
const weights = {
    ecg: 0.30,           // ECG metrics (HR, HRV, arrhythmias)
    lifestyle: 0.25,     // Smoking, exercise, diet
    medical_history: 0.25, // Diabetes, hypertension, family history
    demographics: 0.20   // Age, gender
};

// Risk Levels
- 0-25:  Low Risk (Green)
- 26-50: Moderate Risk (Yellow)
- 51-75: High Risk (Orange)
- 76-100: Critical Risk (Red)

// Time-Based Predictions
- 30-day risk probability
- 90-day risk probability
- 1-year risk probability
```

---

## 6. ML/AI Service

### 6.1 Service Overview (`ml-service/app.py`)

```python
# Flask Application
app = Flask(__name__)
CORS(app)

# Endpoints
GET  /health           # Service health check
POST /analyze          # Single ECG analysis
POST /batch-analyze    # Batch ECG analysis
POST /risk/calculate   # Risk score calculation
POST /diet/recommend   # AI diet recommendations
POST /chat/context     # RAG context for chatbot

# Model Loading (Async)
def load_models_async():
    from enhanced_ecg_analyzer import get_analyzer
    analyzer = get_analyzer(sample_rate=250)
    # Load deep learning model if available
```

### 6.2 ECG Analyzer (`ml-service/ecg_analyzer.py`)

```python
class ECGAnalyzer:
    """Hybrid ECG Analysis: Rule-based + ML"""
    
    def __init__(self):
        self.sample_rate = 250
        
    def preprocess(self, ecg_signal, sample_rate):
        """
        1. Remove DC offset
        2. Bandpass filter (5-15 Hz)
        3. Normalize signal
        """
        
    def detect_qrs_pan_tompkins(self, ecg_signal, sample_rate):
        """
        Pan-Tompkins Algorithm:
        1. Bandpass filter
        2. Derivative
        3. Squaring
        4. Moving window integration
        5. Adaptive thresholding
        """
        
    def calculate_heart_rate(self, r_peaks, sample_rate):
        """Calculate BPM from R-R intervals"""
        
    def calculate_hrv(self, rr_intervals):
        """
        HRV Metrics:
        - SDNN: Standard deviation of NN intervals
        - RMSSD: Root mean square of successive differences
        - pNN50: % of intervals differing by >50ms
        """
        
    def classify(self, ecg_signal):
        """
        Classification Classes:
        - Normal Sinus Rhythm
        - Atrial Fibrillation
        - Premature Ventricular Contractions
        - Sinus Bradycardia
        - Sinus Tachycardia
        - Ventricular Tachycardia
        """
```

### 6.3 Enhanced Analyzer (`ml-service/enhanced_ecg_analyzer.py`)

```python
# Ensemble Classification
class EnhancedECGAnalyzer:
    """
    Multi-model ensemble for improved accuracy:
    1. Rule-based classifier (clinical rules)
    2. Feature-based ML (Random Forest)
    3. Deep learning (CNN/Transformer) - optional
    """
    
    def analyze(self, ecg_data, precalculated_metrics=None):
        # Use pre-calculated metrics if available
        # Otherwise, compute from raw signal
        
        # Combine multiple classifiers
        # Return consensus classification
```

### 6.4 Risk Scorer (`ml-service/risk_scorer.py`)

```python
class CardiacRiskScorer:
    """Predicts cardiac event risk"""
    
    def calculate_risk_score(self, user_data):
        ecg_score = self._calculate_ecg_risk(...)
        lifestyle_score = self._calculate_lifestyle_risk(...)
        medical_score = self._calculate_medical_history_risk(...)
        demographic_score = self._calculate_demographic_risk(...)
        
        overall = weighted_average(...)
        risk_level = self._determine_risk_level(overall)
        
        return {
            'overall_score': overall,
            'risk_level': risk_level,
            'risk_30_days': probability_30_days,
            'recommendations': [...]
        }
```

### 6.5 Diet Recommender (`ml-service/diet_recommender.py`)

```python
class DietRecommender:
    """AI-Powered Diet Recommendations using Google Gemini"""
    
    def __init__(self):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
    def generate_recommendations(self, profile, medical_history, 
                                  medications, ecg_timeline):
        context = self._prepare_context(...)
        
        if self.ai_enabled:
            return self._generate_ai_recommendations(context)
        else:
            return self._generate_rule_based_recommendations(context)
```

---

## 7. Frontend Application

### 7.1 Application Entry (`frontend/src/App.js`)

```jsx
// Core Providers
<QueryClientProvider>      // React Query for data fetching
  <ThemeProvider>          // Dark/Light mode
    <AuthProvider>         // Authentication context
      <SocketProvider>     // Real-time WebSocket
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="monitor" element={<ECGMonitor />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="profile" element={<Profile />} />
              <Route path="diet" element={<DietRecommendations />} />
              <Route path="risk-score" element={<RiskScore />} />
              <Route path="weekly-summary" element={<WeeklySummary />} />
              <Route path="doctor/dashboard" element={<DoctorDashboard />} />
            </Route>
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
```

### 7.2 Key Pages

#### Dashboard (`pages/Dashboard.js`)
- System health overview
- Quick stats (sessions, devices, analyses)
- Recent ECG sessions list
- Motivational health quotes
- Device connection status

#### ECG Monitor (`pages/ECGMonitor.js`)
- Real-time ECG waveform display
- Session start/stop controls
- Device selection
- Recording duration timer
- Live heart rate display

#### Analysis (`pages/Analysis.js`)
- ECG classification results
- Confidence scores
- Risk level indicators
- HRV metrics visualization
- Abnormality detection alerts

#### Profile (`pages/Profile.js`)
- Personal information
- Medical history form
- Current medications
- Allergies & dietary restrictions
- Health conditions

#### Diet Recommendations (`pages/DietRecommendations.js`)
- Personalized diet goals
- Nutrient focus (prioritize/limit/avoid)
- Food group guidance
- Sample meal plans
- Expert tips

#### Risk Score (`pages/RiskScore.js`)
- Overall risk score (0-100)
- Risk breakdown by category
- Time-based predictions
- Risk factors identification
- Personalized recommendations

#### Weekly Summary (`pages/WeeklySummaryEnhanced.js`)
- Week-over-week trends
- Heart rate statistics
- Session history
- Classification distribution
- Health insights

### 7.3 Key Components

#### Real-Time ECG Chart (`components/ECG/RealTimeECGChart.js`)
```jsx
// Chart.js based real-time ECG visualization
- Streaming data display
- Auto-scrolling X-axis
- Grid overlay (like ECG paper)
- Heart rate overlay
- Signal quality indicator
```

#### Chat Assistant (`components/ChatAssistant.js`)
```jsx
// AI-powered medical chatbot
- Conversation history
- Context-aware responses
- Medical terminology explanation
- Emergency detection
```

#### Layout (`components/Layout/Layout.js`)
```jsx
// Main application layout
- Responsive sidebar navigation
- Top header with user info
- Notification system
- Theme toggle
```

---

## 8. Database Schema

### 8.1 Core Tables

```sql
-- Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'patient',
    activated BOOLEAN DEFAULT FALSE,
    subscription_tier VARCHAR(20) DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    phone VARCHAR(20)
);

-- Medical History
CREATE TABLE medical_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    has_hypertension BOOLEAN,
    has_diabetes BOOLEAN,
    diabetes_type VARCHAR(20),
    has_high_cholesterol BOOLEAN,
    cholesterol_level DECIMAL(5,2),
    previous_heart_attack BOOLEAN,
    previous_heart_failure BOOLEAN,
    previous_arrhythmia BOOLEAN,
    is_smoker BOOLEAN,
    exercise_frequency VARCHAR(50),
    diet_type VARCHAR(50),
    allergies TEXT[],
    dietary_restrictions TEXT[]
);

-- Medications
CREATE TABLE medications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    medication_name VARCHAR(200),
    generic_name VARCHAR(200),
    medication_class VARCHAR(100),
    dosage DECIMAL(10,2),
    unit VARCHAR(20),
    frequency VARCHAR(50),
    purpose TEXT,
    is_current BOOLEAN DEFAULT TRUE
);

-- ECG Data
CREATE TABLE ecg_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_name VARCHAR(200),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    sample_rate INTEGER DEFAULT 250,
    device_id VARCHAR(100),
    is_completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE ecg_data_points (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES ecg_sessions(id),
    timestamp_ms BIGINT NOT NULL,
    voltage_mv DECIMAL(10,6) NOT NULL,
    quality_score DECIMAL(3,2),
    is_artifact BOOLEAN DEFAULT FALSE
);

-- Analysis Results
CREATE TABLE ecg_analysis_results (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES ecg_sessions(id),
    analysis_type VARCHAR(100),
    confidence_score DECIMAL(5,4),
    predictions JSONB,
    abnormalities_detected JSONB,
    risk_level VARCHAR(20),
    recommendations TEXT,
    model_version VARCHAR(50),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk Scores
CREATE TABLE risk_scores (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    overall_score INTEGER,
    risk_level VARCHAR(20),
    ecg_risk_score INTEGER,
    lifestyle_risk_score INTEGER,
    medical_history_risk_score INTEGER,
    demographic_risk_score INTEGER,
    risk_30_days DECIMAL(5,2),
    risk_90_days DECIMAL(5,2),
    risk_1_year DECIMAL(5,2),
    high_risk_factors JSONB,
    recommendations JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diet Plans
CREATE TABLE diet_plans (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    plan_name VARCHAR(200),
    diet_style VARCHAR(50),
    daily_calorie_target INTEGER,
    sodium_limit_mg INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE
);

-- Devices
CREATE TABLE devices (
    id UUID PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE,
    device_name VARCHAR(200),
    firmware_version VARCHAR(50),
    last_seen TIMESTAMP,
    battery_level INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 9. API Documentation

### 9.1 Authentication

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}

Response: 201 Created
{
  "message": "Registration successful",
  "user": { "id": "uuid", "email": "..." },
  "token": "jwt_token"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "user": { "id": "uuid", "email": "...", "role": "patient" }
}
```

### 9.2 ECG Sessions

```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionName": "Morning ECG",
  "deviceId": "HeartWise-ESP32-01",
  "sampleRate": 250
}

Response: 201 Created
{
  "session": {
    "id": "uuid",
    "sessionName": "Morning ECG",
    "startTime": "2025-12-19T10:00:00Z"
  }
}
```

### 9.3 ECG Analysis

```http
POST /api/analysis/hybrid/:sessionId
Authorization: Bearer <token>

Response: 200 OK
{
  "heartRate": 72,
  "mlClassification": {
    "classification": "Normal Sinus Rhythm",
    "confidence": 0.94
  },
  "aiDiagnosis": {
    "classification": "Normal Sinus Rhythm",
    "riskLevel": "low",
    "hrv": {
      "sdnn": 45.2,
      "rmssd": 38.1,
      "pnn50": 12.5
    }
  },
  "overallRisk": "low"
}
```

### 9.4 Diet Recommendations

```http
GET /api/diet/recommendations?ai=true
Authorization: Bearer <token>

Response: 200 OK
{
  "recommendations": {
    "ai_powered": true,
    "goals": ["Reduce blood pressure", "Lower cholesterol"],
    "restrictions": ["Limit sodium to 1500mg/day"],
    "nutrients": {
      "prioritize": ["Omega-3", "Fiber", "Potassium"],
      "limit": ["Sodium", "Saturated fats"],
      "avoid": ["Trans fats"]
    },
    "foodGroups": {
      "increase": [
        {"name": "Fatty Fish", "examples": ["Salmon", "Mackerel"]}
      ],
      "reduce": [
        {"name": "Processed Foods", "reason": "High sodium"}
      ]
    },
    "mealPlan": {
      "breakfast": [{"name": "Oatmeal with Berries", "calories": 320}],
      "lunch": [...],
      "dinner": [...],
      "snacks": [...]
    },
    "tips": ["🍎 Eat 5-7 servings of fruits daily"]
  },
  "profileIncomplete": false
}
```

### 9.5 Risk Score

```http
POST /api/risk/calculate
Authorization: Bearer <token>

Response: 200 OK
{
  "risk_score": {
    "overall_score": 32,
    "risk_level": "moderate",
    "ecg_risk_score": 25,
    "lifestyle_risk_score": 40,
    "medical_history_risk_score": 35,
    "demographic_risk_score": 28,
    "risk_30_days": 2.5,
    "risk_90_days": 5.8,
    "risk_1_year": 12.3,
    "high_risk_factors": ["Hypertension", "Sedentary lifestyle"],
    "recommendations": [
      "Increase physical activity",
      "Monitor blood pressure daily"
    ]
  }
}
```

---

## 10. Features & Modules

### 10.1 Real-Time ECG Monitoring
- **Technology**: WebSocket + Socket.IO
- **Sampling**: 250 Hz from ESP32
- **Display**: Canvas-based waveform rendering
- **Features**: Auto-scroll, grid overlay, heart rate display

### 10.2 AI-Powered Analysis
- **Algorithms**: Pan-Tompkins QRS detection, Ensemble ML
- **Classifications**: 7 cardiac rhythm types
- **Metrics**: Heart rate, HRV (SDNN, RMSSD, pNN50)
- **Confidence**: 0-100% accuracy score

### 10.3 Diet Recommendation Engine
- **AI Provider**: Google Gemini 2.0 Flash
- **Personalization**: Based on health conditions, medications
- **Content**: Goals, restrictions, meal plans, tips
- **Fallback**: Rule-based recommendations

### 10.4 Cardiac Risk Scoring
- **Model**: Weighted ensemble scoring
- **Factors**: ECG, lifestyle, medical history, demographics
- **Predictions**: 30-day, 90-day, 1-year risk
- **Output**: 0-100 score with recommendations

### 10.5 Weekly Health Reports
- **Period**: 7-day rolling window
- **Metrics**: Avg/min/max heart rate, HRV trends
- **Insights**: Classification distribution, trend analysis
- **Export**: PDF report generation (future)

### 10.6 AI Medical Chatbot
- **LLM Provider**: Ollama (Llama 3.1:8b)
- **Context**: User health data, ECG history
- **Safety**: Emergency detection, doctor referral
- **Memory**: Session-based conversation history

### 10.7 Doctor Dashboard
- **Features**: Patient list, remote monitoring
- **Access**: Role-based authentication
- **Alerts**: Abnormal ECG notifications
- **Reports**: Patient health summaries

---

## 11. File Structure

```
heartwise-ecg/
├── arduino/                          # ESP32 Firmware
│   ├── HeartWise_ESP32_READY.ino    # Main Arduino sketch
│   ├── heartwise_ecg_monitor.ino    # Alternative version
│   └── README.md                     # Hardware setup guide
│
├── backend/                          # Node.js Backend
│   ├── server.js                     # Express server entry
│   ├── package.json                  # Dependencies
│   ├── .env                          # Environment variables
│   ├── routes/                       # API Routes
│   │   ├── auth.js                   # Authentication
│   │   ├── sessions.js               # ECG sessions
│   │   ├── ecgData.js                # Raw ECG data
│   │   ├── analysis.js               # ECG analysis
│   │   ├── profile.js                # User profiles
│   │   ├── diet.js                   # Diet recommendations
│   │   ├── risk.js                   # Risk scoring
│   │   ├── healthSummary.js          # Weekly reports
│   │   ├── chatbot.js                # AI chatbot
│   │   ├── doctor.js                 # Doctor dashboard
│   │   ├── devices.js                # Device management
│   │   └── patients.js               # Patient management
│   ├── utils/                        # Utilities
│   │   └── ecgAnalyzer.js            # Rule-based ECG analysis
│   └── scripts/                      # Migration scripts
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── App.js                    # Main app component
│   │   ├── index.js                  # Entry point
│   │   ├── index.css                 # Global styles
│   │   ├── pages/                    # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── ECGMonitor.js
│   │   │   ├── Sessions.js
│   │   │   ├── Analysis.js
│   │   │   ├── Profile.js
│   │   │   ├── DietRecommendations.js
│   │   │   ├── AIDietRecommendations.js
│   │   │   ├── RiskScore.js
│   │   │   ├── WeeklySummaryEnhanced.js
│   │   │   ├── DoctorDashboard.js
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── components/               # Reusable components
│   │   │   ├── ECG/
│   │   │   │   └── RealTimeECGChart.js
│   │   │   ├── Layout/
│   │   │   │   └── Layout.js
│   │   │   ├── Animations/
│   │   │   │   └── Loaders.js
│   │   │   ├── ChatAssistant.js
│   │   │   └── UI/
│   │   ├── context/                  # React Contexts
│   │   │   ├── AuthContext.js
│   │   │   ├── SocketContext.js
│   │   │   └── ThemeContext.js
│   │   ├── utils/                    # Utilities
│   │   │   └── api.js                # Axios instance
│   │   └── theme/                    # Theme configuration
│   └── package.json
│
├── ml-service/                       # Python ML Service
│   ├── app.py                        # Flask server
│   ├── ecg_analyzer.py               # Basic ECG analyzer
│   ├── enhanced_ecg_analyzer.py      # Enhanced analyzer
│   ├── ensemble_classifier.py        # Ensemble ML
│   ├── dl_ecg_model.py               # Deep learning model
│   ├── risk_scorer.py                # Risk calculation
│   ├── diet_recommender.py           # Diet AI
│   ├── rag_service.py                # RAG for chatbot
│   ├── requirements.txt              # Python dependencies
│   └── models/                       # Saved ML models
│
├── database/                         # Database
│   ├── schema.sql                    # Core schema
│   ├── commercial_schema.sql         # Extended schema
│   ├── risk_scoring_schema.sql       # Risk tables
│   └── migrations/                   # Migration scripts
│
├── docker-compose.yml                # Docker configuration
├── package.json                      # Root package
├── start.sh                          # Start all services
├── stop.sh                           # Stop all services
└── README.md                         # Project documentation
```

---

## 12. Setup & Deployment

### 12.1 Prerequisites

```bash
# Required Software
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Arduino IDE (for ESP32)

# Optional
- Docker & Docker Compose
- Ollama (for local LLM)
```

### 12.2 Environment Variables

```bash
# Backend (.env)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=heartwise_ecg
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=5001

# ML Service (.env)
GEMINI_API_KEY=your_gemini_api_key
ML_SERVICE_PORT=5002
```

### 12.3 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Gaggs-daggs/Heartwise.git
cd heartwise-ecg

# 2. Setup database
psql -U postgres -c "CREATE DATABASE heartwise_ecg;"
psql -U postgres -d heartwise_ecg -f database/schema.sql

# 3. Start backend
cd backend
npm install
npm start

# 4. Start ML service
cd ../ml-service
pip install -r requirements.txt
python app.py

# 5. Start frontend
cd ../frontend
npm install
npm start

# 6. Access application
open http://localhost:3000
```

### 12.4 Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📊 Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | ~100+ |
| **Backend Routes** | 12 |
| **Frontend Pages** | 15+ |
| **API Endpoints** | 50+ |
| **Database Tables** | 15+ |
| **ML Models** | 3 (Rule-based, Ensemble, Deep Learning) |
| **AI Providers** | 2 (Google Gemini, Ollama) |

---

## 🔗 External Dependencies

| Service | Purpose | API Key Required |
|---------|---------|------------------|
| Google Gemini | Diet AI, Analysis | Yes |
| Ollama | Local LLM Chatbot | No (local) |
| PostgreSQL | Database | No |

---

**Document Version**: 1.0.0  
**Last Updated**: December 19, 2025  
**Author**: HeartWise Development Team
