/**
 * Doctor Routes
 * API endpoints for doctor/healthcare provider features
 * - Patient management
 * - Prescriptions
 * - Instructions
 * - ECG reviews
 * - Consultations
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

let pool;

// Initialize with database pool
router.initializePool = (dbPool) => {
    pool = dbPool;
};

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Middleware to check if user is a doctor
 */
const requireDoctor = (req, res, next) => {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Doctor privileges required.' });
    }
    next();
};

/**
 * Middleware to verify doctor-patient relationship
 */
const verifyDoctorPatientRelationship = async (req, res, next) => {
    const doctorId = req.user.userId;
    const patientId = req.params.patientId || req.body.patient_id;

    if (!patientId) {
        return res.status(400).json({ error: 'Patient ID required' });
    }

    try {
        const result = await pool.query(
            `SELECT id FROM doctor_patients 
             WHERE doctor_id = $1 AND patient_id = $2 AND status = 'active'`,
            [doctorId, patientId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied. No active relationship with this patient.' });
        }

        next();
    } catch (err) {
        console.error('Error verifying doctor-patient relationship:', err);
        res.status(500).json({ error: 'Failed to verify access' });
    }
};

// ============================================
// DOCTOR DASHBOARD
// ============================================

/**
 * GET /api/doctor/dashboard
 * Get doctor dashboard overview
 */
router.get('/dashboard', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;

    try {
        // Get total patients
        const patientsResult = await pool.query(
            `SELECT COUNT(*) as total FROM doctor_patients WHERE doctor_id = $1 AND status = 'active'`,
            [doctorId]
        );

        // Get today's consultations
        const consultationsResult = await pool.query(
            `SELECT COUNT(*) as total FROM consultations 
             WHERE doctor_id = $1 
             AND DATE(appointment_date) = CURRENT_DATE 
             AND status IN ('scheduled', 'confirmed')`,
            [doctorId]
        );

        // Get pending ECG reviews
        const pendingECGResult = await pool.query(
            `SELECT COUNT(DISTINCT es.id) as total
             FROM ecg_sessions es
             JOIN doctor_patients dp ON es.user_id = dp.patient_id
             LEFT JOIN ecg_doctor_reviews edr ON es.id = edr.ecg_session_id AND edr.doctor_id = $1
             WHERE dp.doctor_id = $1 
             AND dp.status = 'active'
             AND es.analyzed = TRUE
             AND edr.id IS NULL
             AND es.start_time > CURRENT_DATE - INTERVAL '7 days'`,
            [doctorId]
        );

        // Get active prescriptions
        const activePrescriptionsResult = await pool.query(
            `SELECT COUNT(*) as total FROM prescriptions 
             WHERE doctor_id = $1 AND status = 'active'`,
            [doctorId]
        );

        // Get unread patient responses
        const unreadResponsesResult = await pool.query(
            `SELECT COUNT(*) as total FROM doctor_instructions 
             WHERE doctor_id = $1 
             AND patient_response IS NOT NULL 
             AND patient_response_at > CURRENT_DATE - INTERVAL '7 days'`,
            [doctorId]
        );

        res.json({
            totalPatients: parseInt(patientsResult.rows[0].total),
            todayConsultations: parseInt(consultationsResult.rows[0].total),
            pendingECGReviews: parseInt(pendingECGResult.rows[0].total),
            activePrescriptions: parseInt(activePrescriptionsResult.rows[0].total),
            unreadResponses: parseInt(unreadResponsesResult.rows[0].total)
        });
    } catch (err) {
        console.error('Error fetching doctor dashboard:', err);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// ============================================
// PATIENT MANAGEMENT
// ============================================

/**
 * GET /api/doctor/patients
 * Get list of doctor's patients
 */
router.get('/patients', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const { status = 'active', search, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT 
                dp.*,
                u.email,
                up.first_name,
                up.last_name,
                up.date_of_birth,
                up.gender,
                up.phone,
                up.profile_photo_url,
                (SELECT COUNT(*) FROM ecg_sessions WHERE user_id = dp.patient_id) as total_ecg_sessions,
                (SELECT MAX(start_time) FROM ecg_sessions WHERE user_id = dp.patient_id) as last_ecg_date,
                (SELECT COUNT(*) FROM prescriptions WHERE patient_id = dp.patient_id AND doctor_id = dp.doctor_id AND status = 'active') as active_prescriptions
            FROM doctor_patients dp
            JOIN users u ON dp.patient_id = u.id
            LEFT JOIN user_profiles up ON dp.patient_id = up.user_id
            WHERE dp.doctor_id = $1
        `;

        const params = [doctorId];
        let paramIndex = 2;

        if (status) {
            query += ` AND dp.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (search) {
            query += ` AND (up.first_name ILIKE $${paramIndex} OR up.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY dp.assigned_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM doctor_patients WHERE doctor_id = $1 ${status ? `AND status = '${status}'` : ''}`;
        const countResult = await pool.query(countQuery, [doctorId]);

        res.json({
            patients: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Error fetching patients:', err);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

/**
 * GET /api/doctor/patients/:patientId
 * Get detailed patient information
 */
router.get('/patients/:patientId', authenticateToken, requireDoctor, verifyDoctorPatientRelationship, async (req, res) => {
    const { patientId } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                u.id, u.email, u.created_at,
                up.*,
                mh.*,
                dp.assigned_date, dp.is_primary_doctor, dp.assignment_notes
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN medical_history mh ON u.id = mh.user_id
            JOIN doctor_patients dp ON u.id = dp.patient_id
            WHERE u.id = $1 AND dp.doctor_id = $2`,
            [patientId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching patient details:', err);
        res.status(500).json({ error: 'Failed to fetch patient details' });
    }
});

/**
 * POST /api/doctor/patients/:patientId/assign
 * Assign a new patient to doctor
 */
router.post('/patients/:patientId/assign', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const { patientId } = req.params;
    const { is_primary_doctor = true, assignment_notes } = req.body;

    try {
        // Check if patient exists and is actually a patient
        const patientCheck = await pool.query(
            `SELECT id, role FROM users WHERE id = $1 AND role = 'patient'`,
            [patientId]
        );

        if (patientCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Check if relationship already exists
        const existingRelationship = await pool.query(
            `SELECT id FROM doctor_patients WHERE doctor_id = $1 AND patient_id = $2`,
            [doctorId, patientId]
        );

        if (existingRelationship.rows.length > 0) {
            return res.status(400).json({ error: 'Patient already assigned to this doctor' });
        }

        // Create relationship
        const result = await pool.query(
            `INSERT INTO doctor_patients (doctor_id, patient_id, is_primary_doctor, assignment_notes, status)
             VALUES ($1, $2, $3, $4, 'active')
             RETURNING *`,
            [doctorId, patientId, is_primary_doctor, assignment_notes]
        );

        res.status(201).json({
            message: 'Patient assigned successfully',
            relationship: result.rows[0]
        });
    } catch (err) {
        console.error('Error assigning patient:', err);
        res.status(500).json({ error: 'Failed to assign patient' });
    }
});

// ============================================
// PRESCRIPTIONS
// ============================================

/**
 * GET /api/doctor/prescriptions
 * Get all prescriptions issued by doctor
 */
router.get('/prescriptions', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const { patient_id, status, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT 
                p.*,
                up.first_name as patient_first_name,
                up.last_name as patient_last_name
            FROM prescriptions p
            JOIN user_profiles up ON p.patient_id = up.user_id
            WHERE p.doctor_id = $1
        `;

        const params = [doctorId];
        let paramIndex = 2;

        if (patient_id) {
            query += ` AND p.patient_id = $${paramIndex}`;
            params.push(patient_id);
            paramIndex++;
        }

        if (status) {
            query += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching prescriptions:', err);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
});

/**
 * POST /api/doctor/prescriptions
 * Create a new prescription
 */
router.post('/prescriptions', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const {
        patient_id,
        medication_name,
        dosage,
        frequency,
        duration,
        route,
        instructions,
        side_effects,
        precautions,
        diagnosis,
        start_date,
        end_date,
        refills_allowed
    } = req.body;

    // Validation
    if (!patient_id || !medication_name || !dosage || !frequency || !instructions) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Verify doctor-patient relationship
        const relationshipCheck = await pool.query(
            `SELECT can_prescribe FROM doctor_patients 
             WHERE doctor_id = $1 AND patient_id = $2 AND status = 'active'`,
            [doctorId, patient_id]
        );

        if (relationshipCheck.rows.length === 0 || !relationshipCheck.rows[0].can_prescribe) {
            return res.status(403).json({ error: 'Not authorized to prescribe for this patient' });
        }

        const result = await pool.query(
            `INSERT INTO prescriptions (
                doctor_id, patient_id, medication_name, dosage, frequency, duration, route,
                instructions, side_effects, precautions, diagnosis, start_date, end_date,
                refills_allowed, refills_remaining, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, 'active')
            RETURNING *`,
            [
                doctorId, patient_id, medication_name, dosage, frequency, duration, route,
                instructions, side_effects, precautions, diagnosis, start_date, end_date,
                refills_allowed || 0
            ]
        );

        res.status(201).json({
            message: 'Prescription created successfully',
            prescription: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating prescription:', err);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
});

/**
 * PATCH /api/doctor/prescriptions/:prescriptionId
 * Update prescription
 */
router.patch('/prescriptions/:prescriptionId', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const { prescriptionId } = req.params;
    const updates = req.body;

    try {
        // Verify ownership
        const ownershipCheck = await pool.query(
            `SELECT id FROM prescriptions WHERE id = $1 AND doctor_id = $2`,
            [prescriptionId, doctorId]
        );

        if (ownershipCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to update this prescription' });
        }

        const allowedUpdates = ['dosage', 'frequency', 'duration', 'instructions', 'side_effects', 'precautions', 'status', 'cancelled_reason'];
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedUpdates.includes(key)) {
                updateFields.push(`${key} = $${paramIndex}`);
                updateValues.push(value);
                paramIndex++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(prescriptionId);

        const query = `UPDATE prescriptions SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await pool.query(query, updateValues);

        res.json({
            message: 'Prescription updated successfully',
            prescription: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating prescription:', err);
        res.status(500).json({ error: 'Failed to update prescription' });
    }
});

// ============================================
// DOCTOR INSTRUCTIONS
// ============================================

/**
 * GET /api/doctor/instructions
 * Get all instructions issued by doctor
 */
router.get('/instructions', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const { patient_id, type, priority, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT 
                di.*,
                up.first_name as patient_first_name,
                up.last_name as patient_last_name
            FROM doctor_instructions di
            JOIN user_profiles up ON di.patient_id = up.user_id
            WHERE di.doctor_id = $1 AND di.is_active = TRUE
        `;

        const params = [doctorId];
        let paramIndex = 2;

        if (patient_id) {
            query += ` AND di.patient_id = $${paramIndex}`;
            params.push(patient_id);
            paramIndex++;
        }

        if (type) {
            query += ` AND di.instruction_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (priority) {
            query += ` AND di.priority = $${paramIndex}`;
            params.push(priority);
            paramIndex++;
        }

        query += ` ORDER BY di.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching instructions:', err);
        res.status(500).json({ error: 'Failed to fetch instructions' });
    }
});

/**
 * POST /api/doctor/instructions
 * Create a new instruction for patient
 */
router.post('/instructions', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const {
        patient_id,
        title,
        instruction_type,
        content,
        priority = 'normal',
        related_ecg_session_id,
        related_prescription_id,
        expires_at
    } = req.body;

    if (!patient_id || !title || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Verify doctor-patient relationship
        const relationshipCheck = await pool.query(
            `SELECT id FROM doctor_patients 
             WHERE doctor_id = $1 AND patient_id = $2 AND status = 'active'`,
            [doctorId, patient_id]
        );

        if (relationshipCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No active relationship with this patient' });
        }

        const result = await pool.query(
            `INSERT INTO doctor_instructions (
                doctor_id, patient_id, title, instruction_type, content, priority,
                related_ecg_session_id, related_prescription_id, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                doctorId, patient_id, title, instruction_type, content, priority,
                related_ecg_session_id, related_prescription_id, expires_at
            ]
        );

        res.status(201).json({
            message: 'Instruction created successfully',
            instruction: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating instruction:', err);
        res.status(500).json({ error: 'Failed to create instruction' });
    }
});

/**
 * PATCH /api/doctor/instructions/:instructionId
 * Update instruction
 */
router.patch('/instructions/:instructionId', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const { instructionId } = req.params;
    const updates = req.body;

    try {
        // Verify ownership
        const ownershipCheck = await pool.query(
            `SELECT id FROM doctor_instructions WHERE id = $1 AND doctor_id = $2`,
            [instructionId, doctorId]
        );

        if (ownershipCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to update this instruction' });
        }

        const allowedUpdates = ['title', 'content', 'priority', 'is_active', 'expires_at'];
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedUpdates.includes(key)) {
                updateFields.push(`${key} = $${paramIndex}`);
                updateValues.push(value);
                paramIndex++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(instructionId);

        const query = `UPDATE doctor_instructions SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await pool.query(query, updateValues);

        res.json({
            message: 'Instruction updated successfully',
            instruction: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating instruction:', err);
        res.status(500).json({ error: 'Failed to update instruction' });
    }
});

// ============================================
// ECG REVIEWS
// ============================================

/**
 * GET /api/doctor/ecg-sessions
 * Get ECG sessions for doctor's patients
 */
router.get('/ecg-sessions', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const { patient_id, reviewed, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT 
                es.*,
                up.first_name as patient_first_name,
                up.last_name as patient_last_name,
                edr.id as review_id,
                edr.review_notes,
                edr.diagnosis as doctor_diagnosis,
                edr.urgency_level
            FROM ecg_sessions es
            JOIN doctor_patients dp ON es.user_id = dp.patient_id
            JOIN user_profiles up ON es.user_id = up.user_id
            LEFT JOIN ecg_doctor_reviews edr ON es.id = edr.ecg_session_id AND edr.doctor_id = $1
            WHERE dp.doctor_id = $1 AND dp.status = 'active' AND es.analyzed = TRUE
        `;

        const params = [doctorId];
        let paramIndex = 2;

        if (patient_id) {
            query += ` AND es.user_id = $${paramIndex}`;
            params.push(patient_id);
            paramIndex++;
        }

        if (reviewed === 'true') {
            query += ` AND edr.id IS NOT NULL`;
        } else if (reviewed === 'false') {
            query += ` AND edr.id IS NULL`;
        }

        query += ` ORDER BY es.start_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching ECG sessions:', err);
        res.status(500).json({ error: 'Failed to fetch ECG sessions' });
    }
});

/**
 * POST /api/doctor/ecg-reviews
 * Create a review for an ECG session
 */
router.post('/ecg-reviews', authenticateToken, requireDoctor, async (req, res) => {
    const doctorId = req.user.userId;
    const {
        ecg_session_id,
        patient_id,
        review_notes,
        diagnosis,
        recommended_actions,
        urgency_level = 'routine',
        requires_follow_up = false,
        follow_up_date,
        follow_up_notes
    } = req.body;

    if (!ecg_session_id || !patient_id || !review_notes) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Verify doctor-patient relationship
        const relationshipCheck = await pool.query(
            `SELECT id FROM doctor_patients 
             WHERE doctor_id = $1 AND patient_id = $2 AND status = 'active'`,
            [doctorId, patient_id]
        );

        if (relationshipCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No active relationship with this patient' });
        }

        // Check if already reviewed
        const existingReview = await pool.query(
            `SELECT id FROM ecg_doctor_reviews WHERE ecg_session_id = $1 AND doctor_id = $2`,
            [ecg_session_id, doctorId]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({ error: 'ECG session already reviewed by this doctor' });
        }

        const result = await pool.query(
            `INSERT INTO ecg_doctor_reviews (
                ecg_session_id, doctor_id, patient_id, review_notes, diagnosis,
                recommended_actions, urgency_level, requires_follow_up, follow_up_date, follow_up_notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                ecg_session_id, doctorId, patient_id, review_notes, diagnosis,
                recommended_actions, urgency_level, requires_follow_up, follow_up_date, follow_up_notes
            ]
        );

        res.status(201).json({
            message: 'ECG review created successfully',
            review: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating ECG review:', err);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

module.exports = router;
