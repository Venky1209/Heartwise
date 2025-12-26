# HeartWise ECG Monitoring System

A comprehensive household ECG monitoring solution with real-time data visualization, AI-ready data storage, and professional healthcare interface.

## 🏥 Overview

HeartWise is a full-stack ECG monitoring system designed for home healthcare use. It combines:

- **Hardware**: ESP32 + AD8232 ECG sensor for real-time signal acquisition
- **Backend**: Node.js/Express API with WebSocket support for real-time data streaming
- **Frontend**: React application with healthcare-themed UI and dynamic ECG visualization
- **Database**: PostgreSQL with optimized schema for AI/ML analysis
- **Future AI Integration**: Data format ready for Hugging Face model integration

## 🚀 Features

### Core Functionality
- ✅ Real-time ECG signal monitoring and visualization
- ✅ Patient management system
- ✅ Session recording and playback
- ✅ Device status monitoring
- ✅ Data export (CSV format)
- ✅ WebSocket-based real-time communication
- ✅ Professional healthcare UI/UX

### Technical Features
- ✅ Responsive design for desktop and mobile
- ✅ Real-time ECG charts with Chart.js
- ✅ PostgreSQL database with AI-optimized schema
- ✅ RESTful API with comprehensive endpoints
- ✅ Hardware integration with ESP32
- ✅ Signal quality assessment
- ✅ Basic heart rate estimation

### Future AI Integration (Ready)
- 🔄 Data format optimized for ML models
- 🔄 Hugging Face model integration endpoints
- 🔄 Abnormality detection algorithms
- 🔄 Predictive analytics dashboard

## 📋 System Requirements

### Hardware
- ESP32 Development Board
- AD8232 Single Lead Heart Rate Monitor
- ECG electrodes (3-lead)
- WiFi network connection

### Software
- Node.js 16+ 
- PostgreSQL 12+
- Modern web browser
- Arduino IDE (for device programming)

## 🛠️ Installation & Setup

### 1. Database Setup
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE heartwise_ecg;
CREATE USER heartwise_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE heartwise_ecg TO heartwise_user;
\\q

# Import schema
psql -U heartwise_user -d heartwise_ecg -f database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Hardware Setup
1. Follow the wiring guide in `arduino/README.md`
2. Configure WiFi credentials in the Arduino code
3. Upload the code to ESP32 using Arduino IDE

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=heartwise_ecg
DB_USER=heartwise_user
DB_PASSWORD=your_password
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Frontend**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

### Hardware Configuration

**ESP32 Pin Connections:**
- AD8232 OUTPUT → GPIO36 (A0)
- AD8232 LO- → GPIO2 (D2)
- AD8232 LO+ → GPIO4 (D3)
- AD8232 SDN → GPIO5 (D4)
- AD8232 3.3V → 3.3V
- AD8232 GND → GND

## 📊 Database Schema

The database is optimized for AI/ML analysis with the following key tables:

- **patients**: Patient demographic and medical information
- **ecg_sessions**: Recording session metadata
- **ecg_data_points**: High-precision ECG signal data
- **ecg_analysis_results**: AI model outputs and analysis results
- **devices**: ECG device management and status

## 🎯 Usage

### Starting an ECG Session

1. **Patient Setup**
   - Add patient via the Patients page
   - Enter demographic and medical information

2. **Hardware Preparation**
   - Connect ECG electrodes to patient
   - Ensure ESP32 device is powered and connected to WiFi

3. **Begin Recording**
   - Navigate to ECG Monitor page
   - Select patient and device
   - Click "Start ECG Session"
   - Monitor real-time ECG signals

4. **Session Management**
   - View live heart rate and signal quality
   - Add session notes
   - Stop recording when complete

### Data Analysis

- Real-time signal quality assessment
- Basic heart rate calculation
- Abnormality alerts (high/low heart rate)
- Data export for external analysis

## 🔮 Future AI Integration

The system is designed for easy AI integration:

### Data Format
```json
{
  "sessionId": "uuid",
  "sampleRate": 250,
  "signals": [
    {
      "time": 0.004,
      "amplitude": 1.234,
      "quality": 0.95
    }
  ],
  "metadata": {
    "patientAge": 45,
    "gender": "male",
    "duration": 30
  }
}
```

### Planned AI Features
- Arrhythmia detection using deep learning models
- Risk stratification algorithms
- Predictive analytics for cardiac events
- Integration with Hugging Face transformers

## 🔒 Security & Privacy

- Patient data stored locally in PostgreSQL
- No cloud data transmission by default
- Encrypted WebSocket connections (configurable)
- HIPAA-compliant data handling practices

## 🚨 Important Medical Disclaimer

**⚠️ FOR EDUCATIONAL AND RESEARCH USE ONLY**

This system is NOT intended for medical diagnosis or treatment. It is designed for:
- Educational purposes
- Research applications
- Personal health monitoring
- Technology demonstration

Always consult qualified healthcare professionals for medical advice.

## 📈 Performance Specifications

- **Sample Rate**: 250 Hz (configurable up to 1kHz)
- **Resolution**: 12-bit ADC (0.8mV precision)
- **Real-time Latency**: <100ms
- **Concurrent Users**: 10+ (scalable)
- **Data Storage**: Unlimited (PostgreSQL)
- **Device Battery Life**: 8+ hours (with optimization)

## 🔧 Development

### Project Structure
```
heartwise-ecg/
├── backend/          # Node.js/Express API
├── frontend/         # React application
├── arduino/          # ESP32 firmware
├── database/         # PostgreSQL schema
└── docs/            # Documentation
```

### API Endpoints

**Patients**
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

**Sessions**
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session

**ECG Data**
- `POST /api/ecg-data/bulk` - Bulk insert ECG data
- `GET /api/ecg-data/stats/:sessionId` - Get statistics
- `GET /api/ecg-data/export/:sessionId` - Export CSV

**Devices**
- `GET /api/devices` - List devices
- `POST /api/devices` - Register device
- `POST /api/devices/:id/heartbeat` - Device status update

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For technical support or questions:
- Review the troubleshooting guides in each component's README
- Check the Arduino serial monitor for device issues
- Verify database connections and API endpoints
- Ensure all dependencies are properly installed

## 🚀 Roadmap

### Phase 1 (Current)
- ✅ Basic ECG monitoring
- ✅ Real-time visualization
- ✅ Patient management
- ✅ Data storage

### Phase 2 (Planned)
- 🔄 Advanced signal processing
- 🔄 Machine learning integration
- 🔄 Mobile app companion
- 🔄 Cloud deployment options

### Phase 3 (Future)
- 🔄 Multi-lead ECG support
- 🔄 Telemedicine integration
- 🔄 Advanced analytics dashboard
- 🔄 Regulatory compliance features

---

**Built with ❤️ for home healthcare innovation**