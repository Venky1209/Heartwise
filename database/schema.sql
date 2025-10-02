-- HeartWise ECG Database Schema
-- Optimized for AI/ML analysis and real-time data storage

-- Note: Run this script while connected to the heartwise_ecg database
-- If database doesn't exist, create it first:
-- CREATE DATABASE heartwise_ecg;
-- Then connect: \c heartwise_ecg;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ECG Sessions table
CREATE TABLE ecg_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    session_name VARCHAR(200),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    sample_rate INTEGER NOT NULL DEFAULT 250, -- Hz
    notes TEXT,
    device_id VARCHAR(100), -- ESP32 MAC address or device identifier
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ECG Data Points table (optimized for AI analysis)
CREATE TABLE ecg_data_points (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES ecg_sessions(id) ON DELETE CASCADE,
    timestamp_ms BIGINT NOT NULL, -- Milliseconds since session start
    voltage_mv DECIMAL(10, 6) NOT NULL, -- Millivolts with high precision
    lead VARCHAR(10) DEFAULT 'I', -- ECG lead (I, II, III, aVR, aVL, aVF, V1-V6)
    quality_score DECIMAL(3, 2), -- Signal quality (0.00 to 1.00)
    is_artifact BOOLEAN DEFAULT FALSE, -- Flagged as noise/artifact
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ECG Analysis Results table (for AI model outputs)
CREATE TABLE ecg_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES ecg_sessions(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL, -- 'rhythm', 'morphology', 'abnormality_detection'
    confidence_score DECIMAL(5, 4), -- 0.0000 to 1.0000
    predictions JSONB, -- Store AI model predictions as JSON
    abnormalities_detected JSONB, -- List of detected abnormalities
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    recommendations TEXT,
    model_version VARCHAR(50),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Devices table (for ESP32 tracking)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) UNIQUE NOT NULL, -- MAC address or unique identifier
    device_name VARCHAR(200),
    firmware_version VARCHAR(50),
    last_seen TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER, -- Percentage
    is_active BOOLEAN DEFAULT TRUE,
    calibration_data JSONB, -- Store calibration parameters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_ecg_data_session_timestamp ON ecg_data_points(session_id, timestamp_ms);
CREATE INDEX idx_ecg_sessions_patient ON ecg_sessions(patient_id);
CREATE INDEX idx_ecg_sessions_start_time ON ecg_sessions(start_time);
CREATE INDEX idx_ecg_data_created_at ON ecg_data_points(created_at);
CREATE INDEX idx_analysis_results_session ON ecg_analysis_results(session_id);

-- Create a view for latest ECG data (useful for real-time display)
CREATE VIEW latest_ecg_data AS
SELECT 
    edp.*,
    es.patient_id,
    es.session_name,
    p.first_name,
    p.last_name
FROM ecg_data_points edp
JOIN ecg_sessions es ON edp.session_id = es.id
JOIN patients p ON es.patient_id = p.id
WHERE edp.created_at > (CURRENT_TIMESTAMP - INTERVAL '5 minutes')
ORDER BY edp.timestamp_ms DESC;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to patients table
CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO patients (first_name, last_name, date_of_birth, gender, email) VALUES
('John', 'Doe', '1980-05-15', 'male', 'john.doe@email.com'),
('Jane', 'Smith', '1975-08-22', 'female', 'jane.smith@email.com');

-- Comments for AI/ML optimization
COMMENT ON TABLE ecg_data_points IS 'Stores raw ECG signals optimized for time-series analysis and ML model training';
COMMENT ON COLUMN ecg_data_points.voltage_mv IS 'ECG voltage in millivolts with high precision for accurate signal analysis';
COMMENT ON COLUMN ecg_data_points.quality_score IS 'Signal quality metric to filter noisy data for AI training';
COMMENT ON TABLE ecg_analysis_results IS 'Stores AI model predictions and analysis results in JSON format for flexibility';