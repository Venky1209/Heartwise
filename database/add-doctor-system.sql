-- ============================================
-- MIGRATION: Add Doctor/Healthcare Provider System
-- Date: November 8, 2025
-- Description: Adds role-based access, doctor profiles, prescriptions, and doctor-patient management
-- ============================================

-- Step 1: Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin'));

-- Update existing users to have 'patient' role
UPDATE users SET role = 'patient' WHERE role IS NULL;

-- Step 2: Create doctor profiles table
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Professional information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(100),
    
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

-- Step 3: Create doctor-patient relationships table
CREATE TABLE IF NOT EXISTS doctor_patients (
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

-- Step 4: Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prescription details
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    route VARCHAR(50),
    
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

-- Step 5: Create doctor instructions table
CREATE TABLE IF NOT EXISTS doctor_instructions (
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

-- Step 6: Create ECG doctor reviews table
CREATE TABLE IF NOT EXISTS ecg_doctor_reviews (
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

-- Step 7: Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
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

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_license ON doctor_profiles(license_number);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_doctor ON doctor_patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_patient ON doctor_patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patients_status ON doctor_patients(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_dates ON prescriptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_doctor_instructions_doctor ON doctor_instructions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_instructions_patient ON doctor_instructions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_instructions_type ON doctor_instructions(instruction_type);
CREATE INDEX IF NOT EXISTS idx_doctor_instructions_unread ON doctor_instructions(patient_id, read_by_patient) WHERE read_by_patient = FALSE;
CREATE INDEX IF NOT EXISTS idx_ecg_reviews_session ON ecg_doctor_reviews(ecg_session_id);
CREATE INDEX IF NOT EXISTS idx_ecg_reviews_doctor ON ecg_doctor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(appointment_date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- Step 9: Create a sample doctor account for testing
DO $$
DECLARE
    doctor_user_id UUID;
BEGIN
    -- Check if a doctor account already exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'doctor' LIMIT 1) THEN
        -- Insert a sample doctor user
        INSERT INTO users (email, password_hash, role, activated, email_verified, subscription_tier, subscription_status)
        VALUES (
            'doctor@heartwise.com',
            '$2a$10$rJ/qFZ1uF8Q9v7xK8yH4XePk4qJZ1KnVz1qH9X5vR1xY2wZ3tU4vK', -- password: doctor123
            'doctor',
            TRUE,
            TRUE,
            'pro',
            'active'
        )
        RETURNING id INTO doctor_user_id;
        
        -- Insert doctor profile
        INSERT INTO doctor_profiles (
            user_id,
            first_name,
            last_name,
            license_number,
            specialization,
            phone,
            clinic_name,
            years_of_experience,
            verified
        ) VALUES (
            doctor_user_id,
            'Dr. John',
            'Smith',
            'MD-12345-2025',
            'Cardiologist',
            '+1-555-0100',
            'HeartWise Cardiology Clinic',
            15,
            TRUE
        );
        
        RAISE NOTICE 'Sample doctor account created: doctor@heartwise.com / doctor123';
    END IF;
END $$;

-- Migration complete message
DO $$
BEGIN
    RAISE NOTICE '✅ Doctor system migration completed successfully!';
    RAISE NOTICE 'New tables created: doctor_profiles, doctor_patients, prescriptions, doctor_instructions, ecg_doctor_reviews, consultations';
    RAISE NOTICE 'Role field added to users table';
    RAISE NOTICE 'Sample doctor account: doctor@heartwise.com / doctor123';
END $$;
