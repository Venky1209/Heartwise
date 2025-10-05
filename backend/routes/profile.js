/**
 * User Profile Management Routes
 * Handles user profile creation, updates, medical history, and medications
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

let pool;

router.initializePool = (dbPool) => {
    pool = dbPool;
};

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * POST /profile/complete
 * Complete user profile (onboarding step 1)
 */
router.post('/complete', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        heightCm,
        weightKg,
        bloodType,
        phone,
        address,
        emergencyContact,
        timezone,
        language
    } = req.body;

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !gender) {
        return res.status(400).json({ 
            error: 'First name, last name, date of birth, and gender are required' 
        });
    }

    try {
        // Check if profile already exists
        const existingProfile = await pool.query(
            'SELECT id FROM user_profiles WHERE user_id = $1',
            [userId]
        );

        let result;
        if (existingProfile.rows.length > 0) {
            // Update existing profile
            result = await pool.query(
                `UPDATE user_profiles 
                 SET first_name = $1, last_name = $2, date_of_birth = $3, gender = $4,
                     height_cm = $5, weight_kg = $6, blood_type = $7, phone = $8,
                     address_line1 = $9, address_line2 = $10, city = $11, state = $12,
                     postal_code = $13, country = $14,
                     emergency_contact_name = $15, emergency_contact_phone = $16, 
                     emergency_contact_relationship = $17,
                     timezone = $18, language = $19,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $20
                 RETURNING *`,
                [
                    firstName, lastName, dateOfBirth, gender,
                    heightCm, weightKg, bloodType, phone,
                    address?.line1, address?.line2, address?.city, address?.state,
                    address?.postalCode, address?.country,
                    emergencyContact?.name, emergencyContact?.phone, emergencyContact?.relationship,
                    timezone || 'UTC', language || 'en',
                    userId
                ]
            );
        } else {
            // Create new profile
            result = await pool.query(
                `INSERT INTO user_profiles (
                    user_id, first_name, last_name, date_of_birth, gender,
                    height_cm, weight_kg, blood_type, phone,
                    address_line1, address_line2, city, state, postal_code, country,
                    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
                    timezone, language
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                 RETURNING *`,
                [
                    userId, firstName, lastName, dateOfBirth, gender,
                    heightCm, weightKg, bloodType, phone,
                    address?.line1, address?.line2, address?.city, address?.state,
                    address?.postalCode, address?.country,
                    emergencyContact?.name, emergencyContact?.phone, emergencyContact?.relationship,
                    timezone || 'UTC', language || 'en'
                ]
            );
        }

        res.json({
            message: 'Profile completed successfully',
            profile: result.rows[0],
            nextStep: 'medical_history'
        });

    } catch (err) {
        console.error('Profile completion error:', err);
        res.status(500).json({ error: 'Failed to complete profile' });
    }
});

/**
 * GET /profile
 * Get user profile
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM user_profiles WHERE user_id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

/**
 * PATCH /profile
 * Update specific profile fields
 */
router.patch('/', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
        'first_name', 'last_name', 'date_of_birth', 'gender', 'height_cm', 'weight_kg',
        'blood_type', 'phone', 'address_line1', 'address_line2', 'city', 'state',
        'postal_code', 'country', 'emergency_contact_name', 'emergency_contact_phone',
        'emergency_contact_relationship', 'timezone', 'language'
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            updateFields.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        }
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(userId);

    try {
        const query = `
            UPDATE user_profiles 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            profile: result.rows[0]
        });

    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ============================================
// MEDICAL HISTORY
// ============================================

/**
 * POST /profile/medical-history
 * Create or update medical history (onboarding step 2)
 */
router.post('/medical-history', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const history = req.body;

    console.log('=== Medical History Save Request ===');
    console.log('User ID:', userId);
    console.log('Request body keys:', Object.keys(history));
    console.log('Request body:', JSON.stringify(history, null, 2));

    try {
        // Normalize field names (accept both camelCase and snake_case)
        const normalize = (data) => ({
            previous_heart_attack: data.previous_heart_attack ?? data.previousHeartAttack,
            heart_attack_date: data.heart_attack_date ?? data.heartAttackDate,
            previous_angina: data.previous_angina ?? data.previousAngina,
            previous_arrhythmia: data.previous_arrhythmia ?? data.previousArrhythmia,
            arrhythmia_type: data.arrhythmia_type ?? data.arrhythmiaType,
            previous_heart_failure: data.previous_heart_failure ?? data.previousHeartFailure,
            previous_stroke: data.previous_stroke ?? data.previousStroke,
            previous_valve_disease: data.previous_valve_disease ?? data.previousValveDisease ?? false,
            previous_cardiomyopathy: data.previous_cardiomyopathy ?? data.previousCardiomyopathy ?? false,
            previous_congenital_heart_disease: data.previous_congenital_heart_disease ?? data.previousCongenitalHeartDisease ?? false,
            previous_peripheral_artery_disease: data.previous_peripheral_artery_disease ?? data.previousPeripheralArteryDisease ?? false,
            family_cardiac_history: data.family_cardiac_history ?? data.familyCardiacHistory,
            family_cardiac_details: data.family_cardiac_details ?? data.familyCardiacDetails,
            cardiac_procedures: data.cardiac_procedures ?? data.cardiacProcedures,
            last_cardiac_event_date: data.last_cardiac_event_date ?? data.lastCardiacEventDate,
            pacemaker: data.pacemaker,
            pacemaker_type: data.pacemaker_type ?? data.pacemakerType,
            icd_implanted: data.icd_implanted ?? data.icdImplanted,
            has_hypertension: data.has_hypertension ?? data.hasHypertension,
            hypertension_diagnosed_date: data.hypertension_diagnosed_date ?? data.hypertensionDiagnosedDate,
            has_diabetes: data.has_diabetes ?? data.hasDiabetes,
            diabetes_type: data.diabetes_type ?? data.diabetesType,
            has_high_cholesterol: data.has_high_cholesterol ?? data.hasHighCholesterol,
            cholesterol_level: data.cholesterol_level ?? data.cholesterolLevel,
            smoker: data.smoker,
            smoking_pack_years: data.smoking_pack_years ?? data.smokingPackYears,
            quit_smoking_date: data.quit_smoking_date ?? data.quitSmokingDate,
            alcohol_consumption: data.alcohol_consumption ?? data.alcoholConsumption,
            exercise_frequency: data.exercise_frequency ?? data.exerciseFrequency,
            diet_type: data.diet_type ?? data.dietType,
            resting_heart_rate: data.resting_heart_rate ?? data.restingHeartRate,
            blood_pressure_systolic: data.blood_pressure_systolic ?? data.bloodPressureSystolic,
            blood_pressure_diastolic: data.blood_pressure_diastolic ?? data.bloodPressureDiastolic,
            has_kidney_disease: data.has_kidney_disease ?? data.hasKidneyDisease,
            has_lung_disease: data.has_lung_disease ?? data.hasLungDisease,
            has_thyroid_disorder: data.has_thyroid_disorder ?? data.hasThyroidDisorder,
            other_conditions: data.other_conditions ?? data.otherConditions,
            sleep_hours_avg: data.sleep_hours_avg ?? data.sleepHoursAvg,
            has_sleep_apnea: data.has_sleep_apnea ?? data.hasSleepApnea,
            allergies: data.allergies,
            dietary_restrictions: data.dietary_restrictions ?? data.dietaryRestrictions,
            physician_name: data.physician_name ?? data.physicianName,
            physician_phone: data.physician_phone ?? data.physicianPhone,
            physician_email: data.physician_email ?? data.physicianEmail
        });

        const normalizedData = normalize(history);
        console.log('Normalized data keys:', Object.keys(normalizedData));
        console.log('Normalized data sample:', {
            previous_valve_disease: normalizedData.previous_valve_disease,
            previous_cardiomyopathy: normalizedData.previous_cardiomyopathy,
            previous_congenital_heart_disease: normalizedData.previous_congenital_heart_disease,
            previous_peripheral_artery_disease: normalizedData.previous_peripheral_artery_disease,
            has_hypertension: normalizedData.has_hypertension,
            smoker: normalizedData.smoker
        });

        // Check if medical history already exists
        const existing = await pool.query(
            'SELECT id FROM medical_history WHERE user_id = $1',
            [userId]
        );

        let result;
        if (existing.rows.length > 0) {
            // Update existing - include new cardiac condition fields
            result = await pool.query(
                `UPDATE medical_history SET
                    previous_heart_attack = $1, heart_attack_date = $2,
                    previous_angina = $3, previous_arrhythmia = $4, arrhythmia_type = $5,
                    previous_heart_failure = $6, previous_stroke = $7,
                    previous_valve_disease = $8, previous_cardiomyopathy = $9,
                    previous_congenital_heart_disease = $10, previous_peripheral_artery_disease = $11,
                    family_cardiac_history = $12, family_cardiac_details = $13,
                    cardiac_procedures = $14, last_cardiac_event_date = $15,
                    pacemaker = $16, pacemaker_type = $17, icd_implanted = $18,
                    has_hypertension = $19, hypertension_diagnosed_date = $20,
                    has_diabetes = $21, diabetes_type = $22,
                    has_high_cholesterol = $23, cholesterol_level = $24,
                    smoker = $25, smoking_pack_years = $26, quit_smoking_date = $27,
                    alcohol_consumption = $28, exercise_frequency = $29, diet_type = $30,
                    resting_heart_rate = $31, blood_pressure_systolic = $32, blood_pressure_diastolic = $33,
                    has_kidney_disease = $34, has_lung_disease = $35, has_thyroid_disorder = $36,
                    other_conditions = $37, sleep_hours_avg = $38, has_sleep_apnea = $39,
                    allergies = $40, dietary_restrictions = $41,
                    physician_name = $42, physician_phone = $43, physician_email = $44,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $45
                 RETURNING *`,
                [
                    normalizedData.previous_heart_attack, normalizedData.heart_attack_date,
                    normalizedData.previous_angina, normalizedData.previous_arrhythmia, normalizedData.arrhythmia_type,
                    normalizedData.previous_heart_failure, normalizedData.previous_stroke,
                    normalizedData.previous_valve_disease, normalizedData.previous_cardiomyopathy,
                    normalizedData.previous_congenital_heart_disease, normalizedData.previous_peripheral_artery_disease,
                    normalizedData.family_cardiac_history, normalizedData.family_cardiac_details,
                    normalizedData.cardiac_procedures, normalizedData.last_cardiac_event_date,
                    normalizedData.pacemaker, normalizedData.pacemaker_type, normalizedData.icd_implanted,
                    normalizedData.has_hypertension, normalizedData.hypertension_diagnosed_date,
                    normalizedData.has_diabetes, normalizedData.diabetes_type,
                    normalizedData.has_high_cholesterol, normalizedData.cholesterol_level,
                    normalizedData.smoker, normalizedData.smoking_pack_years, normalizedData.quit_smoking_date,
                    normalizedData.alcohol_consumption, normalizedData.exercise_frequency, normalizedData.diet_type,
                    normalizedData.resting_heart_rate, normalizedData.blood_pressure_systolic, normalizedData.blood_pressure_diastolic,
                    normalizedData.has_kidney_disease, normalizedData.has_lung_disease, normalizedData.has_thyroid_disorder,
                    normalizedData.other_conditions, normalizedData.sleep_hours_avg, normalizedData.has_sleep_apnea,
                    normalizedData.allergies, normalizedData.dietary_restrictions,
                    normalizedData.physician_name, normalizedData.physician_phone, normalizedData.physician_email,
                    userId
                ]
            );
        } else {
            // Create new - include new cardiac condition fields
            result = await pool.query(
                `INSERT INTO medical_history (
                    user_id, previous_heart_attack, heart_attack_date,
                    previous_angina, previous_arrhythmia, arrhythmia_type,
                    previous_heart_failure, previous_stroke,
                    previous_valve_disease, previous_cardiomyopathy,
                    previous_congenital_heart_disease, previous_peripheral_artery_disease,
                    family_cardiac_history, family_cardiac_details,
                    cardiac_procedures, last_cardiac_event_date,
                    pacemaker, pacemaker_type, icd_implanted,
                    has_hypertension, hypertension_diagnosed_date,
                    has_diabetes, diabetes_type,
                    has_high_cholesterol, cholesterol_level,
                    smoker, smoking_pack_years, quit_smoking_date,
                    alcohol_consumption, exercise_frequency, diet_type,
                    resting_heart_rate, blood_pressure_systolic, blood_pressure_diastolic,
                    has_kidney_disease, has_lung_disease, has_thyroid_disorder,
                    other_conditions, sleep_hours_avg, has_sleep_apnea,
                    allergies, dietary_restrictions,
                    physician_name, physician_phone, physician_email
                 ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                    $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
                    $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
                    $42, $43, $44, $45
                 ) RETURNING *`,
                [
                    userId, normalizedData.previous_heart_attack, normalizedData.heart_attack_date,
                    normalizedData.previous_angina, normalizedData.previous_arrhythmia, normalizedData.arrhythmia_type,
                    normalizedData.previous_heart_failure, normalizedData.previous_stroke,
                    normalizedData.previous_valve_disease, normalizedData.previous_cardiomyopathy,
                    normalizedData.previous_congenital_heart_disease, normalizedData.previous_peripheral_artery_disease,
                    normalizedData.family_cardiac_history, normalizedData.family_cardiac_details,
                    normalizedData.cardiac_procedures, normalizedData.last_cardiac_event_date,
                    normalizedData.pacemaker, normalizedData.pacemaker_type, normalizedData.icd_implanted,
                    normalizedData.has_hypertension, normalizedData.hypertension_diagnosed_date,
                    normalizedData.has_diabetes, normalizedData.diabetes_type,
                    normalizedData.has_high_cholesterol, normalizedData.cholesterol_level,
                    normalizedData.smoker, normalizedData.smoking_pack_years, normalizedData.quit_smoking_date,
                    normalizedData.alcohol_consumption, normalizedData.exercise_frequency, normalizedData.diet_type,
                    normalizedData.resting_heart_rate, normalizedData.blood_pressure_systolic, normalizedData.blood_pressure_diastolic,
                    normalizedData.has_kidney_disease, normalizedData.has_lung_disease, normalizedData.has_thyroid_disorder,
                    normalizedData.other_conditions, normalizedData.sleep_hours_avg, normalizedData.has_sleep_apnea,
                    normalizedData.allergies, normalizedData.dietary_restrictions,
                    normalizedData.physician_name, normalizedData.physician_phone, normalizedData.physician_email
                ]
            );
        }

        res.json({
            message: 'Medical history saved successfully',
            medicalHistory: result.rows[0],
            nextStep: 'medications'
        });

    } catch (err) {
        console.error('Medical history error:', err);
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
        res.status(500).json({ 
            error: 'Failed to save medical history',
            details: err.message 
        });
    }
});

/**
 * GET /profile/medical-history
 * Get medical history
 */
router.get('/medical-history', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM medical_history WHERE user_id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.json({ message: 'No medical history found', medicalHistory: null });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get medical history error:', err);
        res.status(500).json({ error: 'Failed to get medical history' });
    }
});

// ============================================
// MEDICATIONS
// ============================================

/**
 * POST /profile/medications
 * Add new medication
 */
router.post('/medications', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const {
        medicationName,
        genericName,
        medicationClass,
        dosage,
        unit,
        frequency,
        route,
        startDate,
        endDate,
        prescribingDoctor,
        purpose,
        sideEffects,
        notes,
        reminderEnabled,
        reminderTimes
    } = req.body;

    if (!medicationName || !dosage || !frequency || !startDate) {
        return res.status(400).json({ 
            error: 'Medication name, dosage, frequency, and start date are required' 
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO medications (
                user_id, medication_name, generic_name, medication_class,
                dosage, unit, frequency, route, start_date, end_date,
                prescribing_doctor, purpose, side_effects, notes,
                reminder_enabled, reminder_times, is_current
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             RETURNING *`,
            [
                userId, medicationName, genericName, medicationClass,
                dosage, unit, frequency, route, startDate, endDate,
                prescribingDoctor, purpose, sideEffects, notes,
                reminderEnabled !== false, reminderTimes, !endDate
            ]
        );

        res.status(201).json({
            message: 'Medication added successfully',
            medication: result.rows[0]
        });

    } catch (err) {
        console.error('Add medication error:', err);
        res.status(500).json({ error: 'Failed to add medication' });
    }
});

/**
 * GET /profile/medications
 * Get all medications (with optional filter for current only)
 */
router.get('/medications', authenticateToken, async (req, res) => {
    const { currentOnly } = req.query;

    try {
        let query = 'SELECT * FROM medications WHERE user_id = $1';
        const params = [req.user.userId];

        if (currentOnly === 'true') {
            query += ' AND is_current = TRUE';
        }

        query += ' ORDER BY is_current DESC, start_date DESC';

        const result = await pool.query(query, params);

        res.json(result.rows);

    } catch (err) {
        console.error('Get medications error:', err);
        // If table doesn't exist, return empty array
        if (err.code === '42P01') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Failed to get medications' });
    }
});

/**
 * PATCH /profile/medications/:id
 * Update medication
 */
router.patch('/medications/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Verify medication belongs to user
    try {
        const checkResult = await pool.query(
            'SELECT id FROM medications WHERE id = $1 AND user_id = $2',
            [id, req.user.userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Medication not found' });
        }

        // Build dynamic update
        const allowedFields = [
            'medication_name', 'generic_name', 'medication_class', 'dosage', 'unit',
            'frequency', 'route', 'start_date', 'end_date', 'is_current',
            'prescribing_doctor', 'purpose', 'side_effects', 'notes',
            'reminder_enabled', 'reminder_times'
        ];

        const updateFields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(id);
        values.push(req.user.userId);

        const query = `
            UPDATE medications 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        res.json({
            message: 'Medication updated successfully',
            medication: result.rows[0]
        });

    } catch (err) {
        console.error('Update medication error:', err);
        res.status(500).json({ error: 'Failed to update medication' });
    }
});

/**
 * DELETE /profile/medications/:id
 * Delete medication
 */
router.delete('/medications/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM medications WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Medication not found' });
        }

        res.json({ message: 'Medication deleted successfully' });

    } catch (err) {
        console.error('Delete medication error:', err);
        res.status(500).json({ error: 'Failed to delete medication' });
    }
});

// ============================================
// SYMPTOMS TRACKING
// ============================================

/**
 * POST /profile/symptoms
 * Log a symptom
 */
router.post('/symptoms', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const {
        symptomType,
        severity,
        frequency,
        durationMinutes,
        triggers,
        relievingFactors,
        associatedSymptoms,
        affectedActivities,
        notes
    } = req.body;

    if (!symptomType || !severity) {
        return res.status(400).json({ error: 'Symptom type and severity are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO symptoms (
                user_id, symptom_type, severity, frequency, duration_minutes,
                triggers, relieving_factors, associated_symptoms, affected_activities, notes
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                userId, symptomType, severity, frequency, durationMinutes,
                triggers, relievingFactors, associatedSymptoms, affectedActivities, notes
            ]
        );

        res.status(201).json({
            message: 'Symptom logged successfully',
            symptom: result.rows[0]
        });

    } catch (err) {
        console.error('Log symptom error:', err);
        res.status(500).json({ error: 'Failed to log symptom' });
    }
});

/**
 * GET /profile/symptoms
 * Get symptom history
 */
router.get('/symptoms', authenticateToken, async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM symptoms 
             WHERE user_id = $1 
             ORDER BY recorded_at DESC 
             LIMIT $2 OFFSET $3`,
            [req.user.userId, limit, offset]
        );

        res.json(result.rows);

    } catch (err) {
        console.error('Get symptoms error:', err);
        res.status(500).json({ error: 'Failed to get symptoms' });
    }
});

// ============================================
// BASELINE ECG MANAGEMENT
// ============================================

/**
 * GET /profile/baseline-ecgs
 * Get all baseline ECG records for user
 */
router.get('/baseline-ecgs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM baseline_ecgs 
             WHERE user_id = $1 
             ORDER BY is_active_baseline DESC, recording_date DESC`,
            [req.user.userId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error('Get baseline ECGs error:', err);
        // If table doesn't exist, return empty array
        if (err.code === '42P01') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Failed to get baseline ECGs' });
    }
});

/**
 * POST /profile/baseline-ecgs
 * Upload a new baseline ECG record
 */
router.post('/baseline-ecgs', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const {
        recordingDate,
        recordingFacility,
        performingPhysician,
        filePath,
        fileName,
        fileType,
        fileSizeBytes,
        heartRate,
        prInterval,
        qrsDuration,
        qtInterval,
        qtcInterval,
        interpretation,
        abnormalitiesNoted,
        physicianNotes,
        isActiveBaseline
    } = req.body;

    if (!recordingDate || !filePath) {
        return res.status(400).json({ error: 'Recording date and file path are required' });
    }

    try {
        // If this is set as active baseline, deactivate others
        if (isActiveBaseline) {
            await pool.query(
                'UPDATE baseline_ecgs SET is_active_baseline = FALSE WHERE user_id = $1',
                [userId]
            );
        }

        const result = await pool.query(
            `INSERT INTO baseline_ecgs (
                user_id, recording_date, recording_facility, performing_physician,
                file_path, file_name, file_type, file_size_bytes,
                heart_rate, pr_interval, qrs_duration, qt_interval, qtc_interval,
                interpretation, abnormalities_noted, physician_notes, is_active_baseline
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             RETURNING *`,
            [
                userId, recordingDate, recordingFacility, performingPhysician,
                filePath, fileName, fileType, fileSizeBytes,
                heartRate, prInterval, qrsDuration, qtInterval, qtcInterval,
                interpretation, abnormalitiesNoted, physicianNotes, 
                isActiveBaseline || false
            ]
        );

        res.status(201).json({
            message: 'Baseline ECG uploaded successfully',
            baseline: result.rows[0]
        });

    } catch (err) {
        console.error('Upload baseline ECG error:', err);
        if (err.code === '42P01') {
            return res.status(503).json({ 
                error: 'Baseline ECG feature not available. Please use commercial schema.' 
            });
        }
        res.status(500).json({ error: 'Failed to upload baseline ECG' });
    }
});

/**
 * GET /profile/baseline-ecgs/:id
 * Get specific baseline ECG
 */
router.get('/baseline-ecgs/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM baseline_ecgs WHERE id = $1 AND user_id = $2',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Baseline ECG not found' });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error('Get baseline ECG error:', err);
        res.status(500).json({ error: 'Failed to get baseline ECG' });
    }
});

/**
 * PATCH /profile/baseline-ecgs/:id
 * Update baseline ECG metadata
 */
router.patch('/baseline-ecgs/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        // Verify ownership
        const checkResult = await pool.query(
            'SELECT id FROM baseline_ecgs WHERE id = $1 AND user_id = $2',
            [id, req.user.userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Baseline ECG not found' });
        }

        // If setting as active baseline, deactivate others
        if (updates.isActiveBaseline === true) {
            await pool.query(
                'UPDATE baseline_ecgs SET is_active_baseline = FALSE WHERE user_id = $1 AND id != $2',
                [req.user.userId, id]
            );
        }

        const allowedFields = [
            'recording_date', 'recording_facility', 'performing_physician',
            'heart_rate', 'pr_interval', 'qrs_duration', 'qt_interval', 'qtc_interval',
            'p_axis', 'qrs_axis', 't_axis', 'rr_interval',
            'interpretation', 'abnormalities_noted', 'physician_notes', 'clinical_impression',
            'manually_verified', 'verified_by_user', 'is_active_baseline'
        ];

        const updateFields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbKey)) {
                updateFields.push(`${dbKey} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(id);
        values.push(req.user.userId);

        const query = `
            UPDATE baseline_ecgs 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        res.json({
            message: 'Baseline ECG updated successfully',
            baseline: result.rows[0]
        });

    } catch (err) {
        console.error('Update baseline ECG error:', err);
        res.status(500).json({ error: 'Failed to update baseline ECG' });
    }
});

/**
 * DELETE /profile/baseline-ecgs/:id
 * Delete baseline ECG record
 */
router.delete('/baseline-ecgs/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM baseline_ecgs WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Baseline ECG not found' });
        }

        res.json({ message: 'Baseline ECG deleted successfully' });

    } catch (err) {
        console.error('Delete baseline ECG error:', err);
        res.status(500).json({ error: 'Failed to delete baseline ECG' });
    }
});

module.exports = router;
