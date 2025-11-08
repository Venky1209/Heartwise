# 🏥 Doctor Login & System - Quick Reference

## 🔐 Doctor Login Credentials

### Sample Doctor Account (Already Created)
- **Email:** `doctor@heartwise.com`
- **Password:** `doctor123`
- **Role:** Doctor
- **License:** MD-12345-2025
- **Specialization:** Cardiologist

## 🚀 How to Use

### 1. **Login as Doctor**
1. Go to http://localhost:3000/login
2. Enter email: `doctor@heartwise.com`
3. Enter password: `doctor123`
4. Click "Sign in"
5. You'll be automatically redirected to `/doctor/dashboard`

### 2. **Doctor Dashboard Features**

#### Overview Statistics:
- Total Patients assigned
- Today's Consultations
- Pending ECG Reviews
- Active Prescriptions
- Unread Patient Responses

#### Quick Actions:
- Add New Patient
- Create Prescription
- Send Instruction

#### Recent Patients List:
- View patient details
- See ECG session count
- Check last ECG date
- Monitor patient status

## 📋 Doctor Capabilities

### Patient Management
- View all assigned patients
- Access patient medical history
- Review patient ECG data
- Add clinical notes

### Prescriptions
- Create new prescriptions
- Specify medication, dosage, frequency
- Add instructions and side effects
- Set prescription duration
- Manage refills

### Instructions
- Send dietary guidelines
- Exercise recommendations
- Lifestyle modifications
- Emergency instructions
- Follow-up reminders

### ECG Reviews
- Review patient ECG sessions
- Add diagnosis and notes
- Mark urgency level (routine, follow-up, urgent, emergency)
- Schedule follow-ups
- Recommend actions

### Consultations
- Schedule appointments
- Add consultation notes
- Create treatment plans
- Track consultation history

## 🔄 Patient View

When patients login, they can see:
- Prescriptions from their doctor
- Instructions and recommendations
- Doctor's ECG review notes
- Upcoming consultations

## 🎯 Role-Based Access

### Automatic Redirect on Login:
- **Patients** → `/dashboard` (Patient Dashboard)
- **Doctors** → `/doctor/dashboard` (Doctor Dashboard)
- **Admins** → `/admin/dashboard` (Admin Dashboard - future)

## 📱 API Endpoints Available

### Doctor Dashboard
```
GET /api/doctor/dashboard
```

### Patient Management
```
GET /api/doctor/patients
GET /api/doctor/patients/:patientId
POST /api/doctor/patients/:patientId/assign
```

### Prescriptions
```
GET /api/doctor/prescriptions
POST /api/doctor/prescriptions
PATCH /api/doctor/prescriptions/:id
```

### Instructions
```
GET /api/doctor/instructions
POST /api/doctor/instructions
PATCH /api/doctor/instructions/:id
```

### ECG Reviews
```
GET /api/doctor/ecg-sessions
POST /api/doctor/ecg-reviews
```

## 🔐 Security Features

- Role-based access control (RBAC)
- Doctor-patient relationship verification
- JWT tokens with role information
- Data isolation (doctors only see their patients)
- Permission-based access (can_view_ecg, can_prescribe)

## 🧪 Testing the System

### 1. Login as Doctor
```
Email: doctor@heartwise.com
Password: doctor123
```

### 2. Create a Patient Account (if needed)
Register a new patient account at `/register` with an activation code

### 3. Assign Patient to Doctor
Use the "Add New Patient" button in doctor dashboard
Or use the API:
```javascript
POST /api/doctor/patients/{patient_id}/assign
```

### 4. Create a Prescription
1. Go to "Create Prescription" from dashboard
2. Select patient
3. Enter medication details
4. Add instructions
5. Submit

### 5. Send Instructions
1. Click "Send Instruction"
2. Select patient
3. Choose type (diet, exercise, medication, etc.)
4. Set priority
5. Write content
6. Submit

## 📊 Database Tables

The system uses these new tables:
- `doctor_profiles` - Doctor information
- `doctor_patients` - Doctor-patient relationships
- `prescriptions` - Medication prescriptions
- `doctor_instructions` - Instructions for patients
- `ecg_doctor_reviews` - ECG analysis by doctors
- `consultations` - Appointment scheduling

## ✨ Next Steps

### To Enhance the System:

1. **Create Prescription Form UI**
   - Form to input medication details
   - Dosage calculator
   - Drug interaction checker

2. **Create Instruction Form UI**
   - Rich text editor for instructions
   - Template library
   - Priority indicators

3. **Patient List Management**
   - Search and filter patients
   - Bulk actions
   - Export patient data

4. **ECG Review Interface**
   - ECG waveform viewer
   - Annotation tools
   - Comparison with previous ECGs

5. **Patient Dashboard Updates**
   - "My Doctor" section
   - Prescription list
   - Instructions inbox
   - Response capability

## 🎉 Current Status

✅ Database schema - **COMPLETE**
✅ Backend API - **COMPLETE**
✅ Doctor login - **COMPLETE**
✅ Role-based routing - **COMPLETE**
✅ Doctor dashboard - **COMPLETE**
⏳ Prescription form UI - **PENDING**
⏳ Instruction form UI - **PENDING**
⏳ Patient dashboard updates - **PENDING**

---

## 🆘 Troubleshooting

### Issue: Can't login as doctor
**Solution:** Make sure you're using `doctor@heartwise.com` / `doctor123`

### Issue: Not redirecting to doctor dashboard
**Solution:** Check browser console for errors, clear cache and try again

### Issue: API returns 403 Forbidden
**Solution:** The JWT token needs to include the role. Backend has been updated to include this.

### Issue: No patients showing
**Solution:** You need to assign patients to the doctor first using the patient assignment endpoint

---

**The doctor login system is fully functional and ready to use!**

Simply login at http://localhost:3000/login with the doctor credentials above.
