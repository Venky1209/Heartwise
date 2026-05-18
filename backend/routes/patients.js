const express = require('express');
const router = express.Router();

// ====================================================================
// PATIENTS ROUTES DISABLED - System now uses user-only model
// Each logged-in user IS the patient. No separate patient management.
// ====================================================================

// All routes return 404 or disabled message
router.all('*', (req, res) => {
  res.status(404).json({ 
    error: 'Patients API is disabled',
    message: 'This system uses a user-only model. Each user is their own patient.'
  });
});

module.exports = router;