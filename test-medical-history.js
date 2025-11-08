const axios = require('axios');

// Test data - minimal medical history
const testData = {
    previous_heart_attack: false,
    previous_angina: false,
    previous_arrhythmia: false,
    arrhythmia_type: '',
    previous_heart_failure: false,
    previous_stroke: false,
    previous_valve_disease: false,
    previous_cardiomyopathy: false,
    previous_congenital_heart_disease: false,
    previous_peripheral_artery_disease: false,
    family_cardiac_history: false,
    family_cardiac_details: '',
    cardiac_procedures: [],
    last_cardiac_event_date: null,
    pacemaker: false,
    pacemaker_type: '',
    icd_implanted: false,
    has_hypertension: true,
    hypertension_diagnosed_date: null,
    has_diabetes: false,
    diabetes_type: '',
    has_high_cholesterol: false,
    cholesterol_level: null,
    smoker: 'never',
    smoking_pack_years: null,
    quit_smoking_date: null,
    alcohol_consumption: 'none',
    exercise_frequency: 'moderate',
    diet_type: 'standard',
    resting_heart_rate: null,
    blood_pressure_systolic: null,
    blood_pressure_diastolic: null,
    has_kidney_disease: false,
    has_lung_disease: false,
    has_thyroid_disorder: false,
    other_conditions: [],
    sleep_hours_avg: null,
    has_sleep_apnea: false,
    allergies: [],
    dietary_restrictions: [],
    physician_name: '',
    physician_phone: '',
    physician_email: ''
};

async function testMedicalHistory() {
    try {
        // First, login to get token
        console.log('Logging in...');
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'test@example.com',
            password: 'test123'
        });
        
        const token = loginResponse.data.token;
        console.log('Login successful, token:', token.substring(0, 20) + '...');
        
        // Now test medical history save
        console.log('\nSaving medical history...');
        const response = await axios.post('http://localhost:5001/api/profile/medical-history', 
            testData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        console.log('Success!', response.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

testMedicalHistory();
