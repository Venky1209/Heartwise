const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Validation schemas
const patientSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().max(20).optional(),
  medicalHistory: Joi.string().optional()
});

// Get all patients
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countQuery = 'SELECT COUNT(*) FROM patients';
    const countResult = await req.app.locals.db.query(countQuery);
    const totalPatients = parseInt(countResult.rows[0].count);

    const query = `
      SELECT id, first_name, last_name, date_of_birth, gender, email, phone, created_at
      FROM patients
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await req.app.locals.db.query(query, [limit, offset]);
    
    res.json({
      patients: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPatients / limit),
        totalPatients,
        hasNext: page * limit < totalPatients,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT p.*, 
        COUNT(es.id) as total_sessions,
        MAX(es.start_time) as last_session_date
      FROM patients p
      LEFT JOIN ecg_sessions es ON p.id = es.patient_id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    const result = await req.app.locals.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const { error, value } = patientSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message)
      });
    }

    const { firstName, lastName, dateOfBirth, gender, email, phone, medicalHistory } = value;

    const query = `
      INSERT INTO patients (first_name, last_name, date_of_birth, gender, email, phone, medical_history)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, first_name, last_name, date_of_birth, gender, email, phone, created_at
    `;
    
    const result = await req.app.locals.db.query(query, [
      firstName, lastName, dateOfBirth, gender, email, phone, medicalHistory
    ]);
    
    res.status(201).json({
      message: 'Patient created successfully',
      patient: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = patientSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message)
      });
    }

    const { firstName, lastName, dateOfBirth, gender, email, phone, medicalHistory } = value;

    const query = `
      UPDATE patients 
      SET first_name = $1, last_name = $2, date_of_birth = $3, gender = $4, 
          email = $5, phone = $6, medical_history = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING id, first_name, last_name, date_of_birth, gender, email, phone, updated_at
    `;
    
    const result = await req.app.locals.db.query(query, [
      firstName, lastName, dateOfBirth, gender, email, phone, medicalHistory, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({
      message: 'Patient updated successfully',
      patient: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM patients WHERE id = $1 RETURNING id';
    const result = await req.app.locals.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Search patients
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const searchTerm = `%${term}%`;
    
    const query = `
      SELECT id, first_name, last_name, date_of_birth, gender, email, phone
      FROM patients
      WHERE LOWER(first_name) LIKE LOWER($1) 
         OR LOWER(last_name) LIKE LOWER($1)
         OR LOWER(email) LIKE LOWER($1)
      ORDER BY last_name, first_name
      LIMIT 20
    `;
    
    const result = await req.app.locals.db.query(query, [searchTerm]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

module.exports = router;