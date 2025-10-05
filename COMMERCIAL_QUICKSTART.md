# HeartWise Commercial System - Quick Start Guide

## 🚀 Getting Started

This guide will help you set up and run the complete HeartWise commercial ECG monitoring system with user authentication, device pairing, and personalized health tracking.

---

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Python 3.8+ (for ML service)
- ESP32 device with HeartWise firmware

---

## 🔧 Installation Steps

### 1. Database Setup

**Create Database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE heartwise_ecg;
\q
```

**Run Commercial Schema:**
```bash
cd backend
node scripts/setup-commercial-db.js
```

This will:
- Create all required tables (users, profiles, medical history, devices, etc.)
- Generate 10 sample device activation codes
- Seed cardiac-healthy meal library
- Display activation codes for testing

**Save the activation codes printed - you'll need them for registration!**

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies (if not already installed)
npm install

# Create .env file
cat > .env << EOF
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=heartwise_ecg
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server
PORT=5001
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key-change-in-production-use-long-random-string

# Environment
NODE_ENV=development
EOF

# Start backend server
npm start
```

Backend will run on **http://localhost:5001**

---

### 3. ML Service Setup

```bash
cd ml-service

# Create virtual environment (if not exists)
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start ML service
python app.py
```

ML service will run on **http://localhost:5002**

---

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start frontend
npm start
```

Frontend will run on **http://localhost:3000**

---

## 📱 User Registration & Activation

### Step 1: Register New User

Navigate to **http://localhost:3000/register**

Provide:
- **Email**: your.email@example.com
- **Password**: At least 8 characters
- **Activation Code**: Use one from the setup script output (e.g., HW-A1B2-C3D4-E5F6)

The system will:
1. Create your user account
2. Activate and link your ECG device
3. Generate authentication tokens
4. Redirect you to profile completion

### Step 2: Complete Profile

Fill in your personal information:
- Name, date of birth, gender
- Physical measurements (height, weight, blood type)
- Contact information
- Emergency contact

### Step 3: Medical History

Complete comprehensive health questionnaire:

**Cardiac History:**
- Previous heart conditions
- Family history
- Cardiac procedures
- Medications

**Risk Factors:**
- Hypertension
- Diabetes
- High cholesterol
- Smoking history
- Exercise habits

**Current Medications:**
- List all medications with dosage
- Set medication reminders

### Step 4: Upload Previous ECG (Optional)

If you have previous ECG reports:
1. Navigate to "Baseline ECG" section
2. Upload PDF/image of previous ECG
3. System will parse and extract measurements
4. Set as baseline for comparison

---

## 🔐 API Endpoints

### Authentication

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "activationCode": "HW-1234-5678-9ABC"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**POST /api/auth/refresh**
```json
{
  "refreshToken": "your-refresh-token"
}
```

**GET /api/auth/me**
- Headers: `Authorization: Bearer <access-token>`
- Returns current user info

---

### Profile Management

**POST /api/profile/complete**
- Headers: `Authorization: Bearer <access-token>`
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-05-15",
  "gender": "male",
  "heightCm": 175.5,
  "weightKg": 75.0,
  "bloodType": "A+",
  "phone": "+1234567890",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+0987654321",
    "relationship": "spouse"
  }
}
```

**POST /api/profile/medical-history**
```json
{
  "previousHeartAttack": false,
  "previousAngina": false,
  "hasHypertension": true,
  "hasDiabetes": false,
  "smoker": "never",
  "exerciseFrequency": "moderate",
  "restingHeartRate": 72,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80
}
```

**POST /api/profile/medications**
```json
{
  "medicationName": "Lisinopril",
  "dosage": "10",
  "unit": "mg",
  "frequency": "once daily",
  "route": "oral",
  "startDate": "2024-01-01",
  "prescribingDoctor": "Dr. Smith",
  "purpose": "Blood pressure control"
}
```

---

## 🔌 Device Connection

### ESP32 WebSocket Connection

Your activated device connects to:
```
ws://localhost:5001
```

**Authentication:**
- Device sends MAC address on connection
- Server verifies device is activated and linked to user
- Only linked user can receive data from that device

**ECG Data Format:**
```json
{
  "type": "ecg_data",
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "voltage": 1.234,
  "timestamp": 1234567890
}
```

---

## 📊 Using the System

### Start ECG Monitoring

1. **Login** to your account
2. Navigate to **"ECG Monitor"** page
3. Click **"Start Monitoring"**
4. Turn on your HeartWise device
5. Device auto-connects and streams data
6. View real-time ECG waveform
7. Click **"Stop & Analyze"** when done

### View Analysis Results

After stopping:
- **Heart Rate**: Calculated average
- **Rhythm Classification**: AI-detected rhythm type
- **Abnormalities**: Any detected issues
- **Risk Level**: Low, Medium, High, Critical
- **Recommendations**: Based on findings

### Compare with Baseline

If you uploaded a baseline ECG:
- System auto-compares current reading
- Highlights changes in heart rate, rhythm, morphology
- Alerts on significant deviations
- Shows progress over time

### Weekly Diet Plan

Based on your analysis and medical history:
1. Navigate to **"Diet Plan"** section
2. System generates personalized cardiac-healthy meals
3. View week's meal plan
4. Track daily nutrition
5. Get shopping lists
6. Log meals and track compliance

### Health Trends

View **"Dashboard"** for:
- ECG session history timeline
- Heart rate trends (7-day, 30-day, 90-day)
- Rhythm regularity over time
- Cardiac health score (0-100)
- Active alerts and recommendations

---

## 🔔 Alerts & Notifications

System generates alerts for:
- Significant deviation from baseline
- New abnormalities detected
- Risk level changes
- Medication reminders
- Weekly diet plan updates

---

## 🔐 Security Features

### Authentication
- JWT-based access tokens (7-day expiry)
- Refresh token rotation (30-day expiry)
- Bcrypt password hashing (10 rounds + salt)
- Account lockout after 5 failed attempts

### Data Protection
- Per-user data isolation
- Row-level security
- Audit logging for all actions
- HTTPS/TLS in production
- Secure device-user binding

### Privacy
- Medical data encrypted at rest
- HIPAA-compliant storage architecture
- User-controlled data retention
- Secure session management

---

## 📱 Subscription Tiers

**Basic (Trial/Free):**
- Unlimited ECG recordings
- Basic analysis
- 6 months data retention
- Weekly diet plans

**Pro ($19.99/month):**
- Everything in Basic
- Historical trend analysis
- Advanced AI analysis
- 2 years data retention
- Email alerts
- Export reports

**Premium ($29.99/month):**
- Everything in Pro
- Lifetime data retention
- Priority analysis
- Doctor consultation portal
- Family sharing (4 devices)

---

## 🧪 Testing the System

### 1. Test Registration
```bash
# Use activation code from setup script
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "activationCode": "HW-XXXX-XXXX-XXXX"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### 3. Test Protected Endpoint
```bash
# Use access token from login response
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📈 Next Steps

1. **Complete Implementation:**
   - ✅ User authentication system
   - ✅ Device activation & pairing
   - ✅ Profile & medical history
   - ⏳ Baseline ECG upload & parsing
   - ⏳ Historical trend analysis
   - ⏳ Diet plan generator
   - ⏳ Alert system
   - ⏳ Dashboard with charts

2. **Production Deployment:**
   - Set up SSL/TLS certificates
   - Configure production database
   - Set strong JWT secrets
   - Enable HTTPS
   - Set up email service (SendGrid, AWS SES)
   - Configure cloud storage (S3, GCS)

3. **Mobile App Development:**
   - iOS app with HealthKit integration
   - Android app with Google Fit
   - Push notifications
   - Offline mode

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Verify credentials in .env
psql -U postgres -d heartwise_ecg
```

### Activation Code Invalid
```bash
# Check available codes
psql -U postgres -d heartwise_ecg -c "SELECT activation_code, activated FROM devices;"
```

### JWT Token Expired
- Use refresh token to get new access token
- Re-login if refresh token also expired

### Device Not Connecting
- Verify device is activated
- Check device MAC address matches database
- Ensure backend WebSocket server is running

---

## 📞 Support

For issues or questions:
- Email: support@heartwise.com
- Documentation: https://docs.heartwise.com
- GitHub Issues: https://github.com/heartwise/ecg-monitor

---

## 📄 License

Commercial use requires license agreement.
Personal/Research use: MIT License

---

**🎉 You're all set! Start monitoring your cardiac health with HeartWise!**
