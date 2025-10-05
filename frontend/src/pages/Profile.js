/**
 * Comprehensive User Profile Page
 * Displays and manages:
 * - Personal Information
 * - Medical History (cardiac, conditions, treatments)
 * - Medications
 * - Baseline ECG Records
 * - Recent Symptoms
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  HeartIcon,
  DocumentTextIcon,
  BeakerIcon,
  PencilIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  
  // State for different profile sections
  const [profile, setProfile] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [medications, setMedications] = useState([]);
  const [baselineECGs, setBaselineECGs] = useState([]);
  const [recentSymptoms, setRecentSymptoms] = useState([]);

  const fetchProfileData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all profile data in parallel
      const [profileRes, historyRes, medsRes] = await Promise.all([
        api.get('/profile'),
        api.get('/profile/medical-history').catch(() => ({ data: null })),
        api.get('/profile/medications').catch(() => ({ data: [] }))
      ]);

      setProfile(profileRes.data);
      // Handle medical history response - it may be null or have a medicalHistory property
      const historyData = historyRes.data?.medicalHistory !== undefined 
        ? historyRes.data.medicalHistory 
        : (historyRes.data?.message ? null : historyRes.data);
      setMedicalHistory(historyData);
      setMedications(medsRes.data || []);

      // Additional data if available
      try {
        const baselineRes = await api.get('/profile/baseline-ecgs');
        setBaselineECGs(baselineRes.data || []);
      } catch (err) {
        console.log('No baseline ECGs found');
      }

      try {
        const symptomsRes = await api.get('/profile/symptoms?limit=10');
        setRecentSymptoms(symptomsRes.data || []);
      } catch (err) {
        console.log('No symptoms found');
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 404) {
        toast.error('Profile not found. Please complete your profile.');
        navigate('/profile/complete');
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);



  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = (weightKg, heightCm) => {
    if (!weightKg || !heightCm) return null;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return { text: 'N/A', color: 'gray' };
    if (bmi < 18.5) return { text: 'Underweight', color: 'yellow' };
    if (bmi < 25) return { text: 'Normal', color: 'green' };
    if (bmi < 30) return { text: 'Overweight', color: 'yellow' };
    return { text: 'Obese', color: 'red' };
  };

  const getRiskLevel = (history) => {
    if (!history) return { level: 'Unknown', color: 'gray', count: 0 };
    
    let riskCount = 0;
    if (history.previous_heart_attack) riskCount += 3;
    if (history.previous_heart_failure) riskCount += 3;
    if (history.previous_stroke) riskCount += 2;
    if (history.has_hypertension) riskCount += 1;
    if (history.has_diabetes) riskCount += 1;
    if (history.has_high_cholesterol) riskCount += 1;
    if (history.smoker === 'current') riskCount += 2;
    if (history.family_cardiac_history) riskCount += 1;

    if (riskCount >= 5) return { level: 'High Risk', color: 'red', count: riskCount };
    if (riskCount >= 3) return { level: 'Moderate Risk', color: 'yellow', count: riskCount };
    if (riskCount >= 1) return { level: 'Low Risk', color: 'blue', count: riskCount };
    return { level: 'Low Risk', color: 'green', count: 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Complete</h2>
          <p className="text-gray-600 mb-4">Please complete your profile to access all features.</p>
          <button
            onClick={() => navigate('/profile/complete')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Complete Profile Now
          </button>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(profile.weight_kg, profile.height_cm);
  const bmiCategory = getBMICategory(parseFloat(bmi));
  const riskAssessment = getRiskLevel(medicalHistory);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-full p-3">
              <UserCircleIcon className="h-16 w-16 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-blue-100 mt-1">
                {calculateAge(profile.date_of_birth)} years old • {profile.gender}
              </p>
              <p className="text-blue-100 text-sm mt-1">
                {profile.email || 'No email provided'}
              </p>
            </div>
          </div>
          {!editMode ? (
            <button
              onClick={() => {
                setEditMode(true);
                setEditedProfile({...profile});
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center space-x-2"
            >
              <PencilIcon className="h-5 w-5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  try {
                    await api.patch('/profile', editedProfile);
                    setProfile(editedProfile);
                    setEditMode(false);
                    toast.success('Profile updated successfully!');
                  } catch (error) {
                    toast.error('Failed to update profile');
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditedProfile(null);
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-blue-100 text-sm">Height</p>
            <p className="text-2xl font-bold">{profile.height_cm || 'N/A'} cm</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-blue-100 text-sm">Weight</p>
            <p className="text-2xl font-bold">{profile.weight_kg || 'N/A'} kg</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-blue-100 text-sm">BMI</p>
            <p className="text-2xl font-bold">{bmi || 'N/A'}</p>
            <p className={`text-xs mt-1 text-${bmiCategory.color}-200`}>{bmiCategory.text}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-blue-100 text-sm">Blood Type</p>
            <p className="text-2xl font-bold">{profile.blood_type || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Risk Assessment Banner */}
      {medicalHistory && (
        <div className={`bg-${riskAssessment.color}-50 border border-${riskAssessment.color}-200 rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HeartIcon className={`h-6 w-6 text-${riskAssessment.color}-600`} />
              <div>
                <h3 className={`font-semibold text-${riskAssessment.color}-900`}>
                  Cardiac Risk Level: {riskAssessment.level}
                </h3>
                <p className={`text-sm text-${riskAssessment.color}-700`}>
                  Based on medical history and risk factors
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('medical')}
              className={`text-${riskAssessment.color}-600 hover:text-${riskAssessment.color}-800 text-sm font-medium`}
            >
              View Details →
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            {[
              { id: 'personal', name: 'Personal Info', icon: UserCircleIcon },
              { id: 'medical', name: 'Medical History', icon: HeartIcon },
              { id: 'medications', name: 'Medications', icon: BeakerIcon },
              { id: 'baseline', name: 'Baseline ECGs', icon: DocumentTextIcon },
              { id: 'symptoms', name: 'Symptoms Log', icon: ExclamationTriangleIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <PersonalInfoTab profile={profile} navigate={navigate} />
          )}

          {/* Medical History Tab */}
          {activeTab === 'medical' && (
            <MedicalHistoryTab 
              history={medicalHistory} 
              onUpdate={fetchProfileData}
              navigate={navigate}
            />
          )}

          {/* Medications Tab */}
          {activeTab === 'medications' && (
            <MedicationsTab 
              medications={medications} 
              onUpdate={fetchProfileData}
            />
          )}

          {/* Baseline ECGs Tab */}
          {activeTab === 'baseline' && (
            <BaselineECGsTab 
              baselineECGs={baselineECGs} 
              onUpdate={fetchProfileData}
            />
          )}

          {/* Symptoms Log Tab */}
          {activeTab === 'symptoms' && (
            <SymptomsTab 
              symptoms={recentSymptoms} 
              onUpdate={fetchProfileData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== TAB COMPONENTS ====================

const PersonalInfoTab = ({ profile }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <InfoField label="Email" value={profile.email || 'Not provided'} />
        <InfoField label="Phone" value={profile.phone || 'Not provided'} />
        <InfoField label="Date of Birth" value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'} />
        <InfoField label="Gender" value={profile.gender || 'Not specified'} />
      </div>
    </div>

    {profile.address_line1 && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-900">{profile.address_line1}</p>
          {profile.address_line2 && <p className="text-gray-900">{profile.address_line2}</p>}
          <p className="text-gray-600">
            {[profile.city, profile.state, profile.postal_code, profile.country]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      </div>
    )}

    {profile.emergency_contact_name && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Name" value={profile.emergency_contact_name} />
            <InfoField label="Relationship" value={profile.emergency_contact_relationship || 'Not specified'} />
            <InfoField label="Phone" value={profile.emergency_contact_phone || 'Not provided'} />
          </div>
        </div>
      </div>
    )}

    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
      <div className="grid grid-cols-2 gap-4">
        <InfoField label="Timezone" value={profile.timezone || 'UTC'} />
        <InfoField label="Language" value={profile.language || 'English'} />
      </div>
    </div>
  </div>
);

const MedicalHistoryTab = ({ history, onUpdate, navigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHistory, setEditedHistory] = useState(null);

  const handleEdit = () => {
    // Create a properly initialized object with all fields
    const defaultHistory = {
      // Cardiac History
      previous_heart_attack: false,
      heart_attack_date: null,
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
      
      // Procedures
      cardiac_procedures: [],
      last_cardiac_event_date: null,
      pacemaker: false,
      pacemaker_type: '',
      icd_implanted: false,
      
      // Risk Factors
      has_hypertension: false,
      hypertension_diagnosed_date: null,
      has_diabetes: false,
      diabetes_type: '',
      has_high_cholesterol: false,
      cholesterol_level: null,
      
      // Lifestyle
      smoker: 'never',
      smoking_pack_years: null,
      quit_smoking_date: null,
      alcohol_consumption: 'none',
      exercise_frequency: 'moderate',
      diet_type: 'standard',
      
      // Vitals
      resting_heart_rate: null,
      blood_pressure_systolic: null,
      blood_pressure_diastolic: null,
      
      // Additional Conditions
      has_kidney_disease: false,
      has_lung_disease: false,
      has_thyroid_disorder: false,
      other_conditions: [],
      
      // Sleep
      sleep_hours_avg: null,
      has_sleep_apnea: false,
      
      // Notes
      allergies: [],
      dietary_restrictions: [],
      
      // Physician Info
      physician_name: '',
      physician_phone: '',
      physician_email: ''
    };
    
    // If history exists, filter out database-only fields and merge with defaults
    if (history) {
      const { id, user_id, created_at, updated_at, message, medicalHistory, bmi, ...cleanHistory } = history;
      setEditedHistory({ ...defaultHistory, ...cleanHistory });
    } else {
      setEditedHistory(defaultHistory);
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await api.post('/profile/medical-history', editedHistory);
      toast.success('Medical history updated successfully!');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving medical history:', error);
      toast.error('Failed to update medical history');
    }
  };

  const handleChange = (field, value) => {
    setEditedHistory(prev => ({ ...prev, [field]: value }));
  };

  if (!history && !isEditing) {
    return (
      <div className="text-center py-12">
        <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medical History</h3>
        <p className="text-gray-600 mb-4">Add your medical history for personalized insights</p>
        <button
          onClick={() => {
            toast.info('Please use the Profile Complete wizard to add medical history');
            navigate('/profile/complete');
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Medical History</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Edit Medical History Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Medical History</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cardiac History Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cardiac History</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.previous_heart_attack}
                      onChange={(e) => handleChange('previous_heart_attack', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Previous Heart Attack (Myocardial Infarction)</span>
                  </label>
                  {editedHistory.previous_heart_attack && (
                    <div className="ml-7">
                      <label className="block text-sm text-gray-600 mb-1">Date of heart attack</label>
                      <input
                        type="date"
                        value={editedHistory.heart_attack_date || ''}
                        onChange={(e) => handleChange('heart_attack_date', e.target.value)}
                        className="border rounded px-3 py-2"
                      />
                    </div>
                  )}

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.previous_angina}
                      onChange={(e) => handleChange('previous_angina', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Angina (Chest Pain)</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.previous_arrhythmia}
                      onChange={(e) => handleChange('previous_arrhythmia', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Arrhythmia (Irregular Heartbeat)</span>
                  </label>
                  {editedHistory.previous_arrhythmia && (
                    <div className="ml-7">
                      <label className="block text-sm text-gray-600 mb-1">Type of arrhythmia</label>
                      <select
                        value={editedHistory.arrhythmia_type || ''}
                        onChange={(e) => handleChange('arrhythmia_type', e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                      >
                        <option value="">Select type</option>
                        <option value="Atrial Fibrillation">Atrial Fibrillation (AFib)</option>
                        <option value="Atrial Flutter">Atrial Flutter</option>
                        <option value="Supraventricular Tachycardia">Supraventricular Tachycardia (SVT)</option>
                        <option value="Ventricular Tachycardia">Ventricular Tachycardia (VT)</option>
                        <option value="Ventricular Fibrillation">Ventricular Fibrillation (VFib)</option>
                        <option value="Bradycardia">Bradycardia</option>
                        <option value="Heart Block">Heart Block</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.previous_heart_failure}
                      onChange={(e) => handleChange('previous_heart_failure', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Heart Failure (Congestive Heart Failure)</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.previous_stroke}
                      onChange={(e) => handleChange('previous_stroke', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Stroke or TIA (Transient Ischemic Attack)</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.previous_valve_disease}
                      onChange={(e) => handleChange('previous_valve_disease', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Heart Valve Disease</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.previous_cardiomyopathy}
                      onChange={(e) => handleChange('previous_cardiomyopathy', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Cardiomyopathy (Heart Muscle Disease)</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.previous_congenital_heart_disease}
                      onChange={(e) => handleChange('previous_congenital_heart_disease', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Congenital Heart Disease</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.previous_peripheral_artery_disease}
                      onChange={(e) => handleChange('previous_peripheral_artery_disease', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Peripheral Artery Disease (PAD)</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.pacemaker}
                      onChange={(e) => handleChange('pacemaker', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Pacemaker Implanted</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.icd_implanted}
                      onChange={(e) => handleChange('icd_implanted', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>ICD (Implantable Cardioverter Defibrillator)</span>
                  </label>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.has_hypertension}
                      onChange={(e) => handleChange('has_hypertension', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Hypertension (High Blood Pressure)</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.has_diabetes}
                      onChange={(e) => handleChange('has_diabetes', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Diabetes</span>
                  </label>
                  {editedHistory.has_diabetes && (
                    <div className="ml-7">
                      <label className="block text-sm text-gray-600 mb-1">Diabetes Type</label>
                      <select
                        value={editedHistory.diabetes_type || ''}
                        onChange={(e) => handleChange('diabetes_type', e.target.value)}
                        className="border rounded px-3 py-2"
                      >
                        <option value="">Select type</option>
                        <option value="type1">Type 1</option>
                        <option value="type2">Type 2</option>
                        <option value="gestational">Gestational</option>
                      </select>
                    </div>
                  )}

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.has_high_cholesterol}
                      onChange={(e) => handleChange('has_high_cholesterol', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>High Cholesterol</span>
                  </label>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Smoking Status</label>
                    <select
                      value={editedHistory.smoker || 'never'}
                      onChange={(e) => handleChange('smoker', e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="never">Never Smoked</option>
                      <option value="former">Former Smoker</option>
                      <option value="current">Current Smoker</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lifestyle */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifestyle</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Exercise Frequency</label>
                    <select
                      value={editedHistory.exercise_frequency || 'moderate'}
                      onChange={(e) => handleChange('exercise_frequency', e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Light (1-2 days/week)</option>
                      <option value="moderate">Moderate (3-4 days/week)</option>
                      <option value="active">Active (5-6 days/week)</option>
                      <option value="very_active">Very Active (Daily)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Diet Type</label>
                    <select
                      value={editedHistory.diet_type || 'standard'}
                      onChange={(e) => handleChange('diet_type', e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="standard">Standard</option>
                      <option value="mediterranean">Mediterranean</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="keto">Ketogenic</option>
                      <option value="low_sodium">Low Sodium</option>
                      <option value="dash">DASH Diet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Alcohol Consumption</label>
                    <select
                      value={editedHistory.alcohol_consumption || 'none'}
                      onChange={(e) => handleChange('alcohol_consumption', e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="none">None</option>
                      <option value="occasional">Occasional</option>
                      <option value="moderate">Moderate</option>
                      <option value="heavy">Heavy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Sleep (hours/night)</label>
                    <input
                      type="number"
                      value={editedHistory.sleep_hours_avg || ''}
                      onChange={(e) => handleChange('sleep_hours_avg', e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                      min="0"
                      max="24"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Conditions */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Medical Conditions</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.has_kidney_disease}
                      onChange={(e) => handleChange('has_kidney_disease', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Kidney Disease</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.has_lung_disease}
                      onChange={(e) => handleChange('has_lung_disease', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Lung Disease (COPD, Asthma)</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.has_thyroid_disorder}
                      onChange={(e) => handleChange('has_thyroid_disorder', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Thyroid Disorder</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedHistory.has_sleep_apnea}
                      onChange={(e) => handleChange('has_sleep_apnea', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Sleep Apnea</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <HeartIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Why Your Medical History Matters</h4>
              <p className="text-sm text-blue-800 mb-2">
                Your comprehensive health profile enables personalized care:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• <strong>Personalized Diet Recommendations</strong> - Tailored nutrition plans based on your conditions, allergies, and dietary needs</li>
                <li>• <strong>ECG Comparison Analysis</strong> - Compare current readings with your baseline ECGs to detect abnormalities</li>
                <li>• <strong>Weekly Trend Analysis</strong> - Track changes over time considering your medical history</li>
                <li>• <strong>Risk Assessment</strong> - Calculate your cardiac risk score based on comprehensive health data</li>
              </ul>
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 flex-shrink-0"
          >
            <PencilIcon className="h-5 w-5" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Cardiac History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <HeartIcon className="h-6 w-6 text-red-600" />
          <span>Cardiac History</span>
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <ConditionBadge
            condition="Heart Attack"
            present={history.previous_heart_attack}
            date={history.heart_attack_date}
          />
          <ConditionBadge
            condition="Angina"
            present={history.previous_angina}
          />
          <ConditionBadge
            condition="Arrhythmia"
            present={history.previous_arrhythmia}
            details={history.arrhythmia_type}
          />
          <ConditionBadge
            condition="Heart Failure"
            present={history.previous_heart_failure}
          />
          <ConditionBadge
            condition="Stroke"
            present={history.previous_stroke}
          />
          <ConditionBadge
            condition="Heart Valve Disease"
            present={history.previous_valve_disease}
          />
          <ConditionBadge
            condition="Cardiomyopathy"
            present={history.previous_cardiomyopathy}
          />
          <ConditionBadge
            condition="Congenital Heart Disease"
            present={history.previous_congenital_heart_disease}
          />
          <ConditionBadge
            condition="Peripheral Artery Disease"
            present={history.previous_peripheral_artery_disease}
          />
          {history.pacemaker && (
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              <span className="text-gray-900 font-medium">Pacemaker Implanted</span>
              {history.pacemaker_type && (
                <span className="text-gray-600">({history.pacemaker_type})</span>
              )}
            </div>
          )}
          {history.icd_implanted && (
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              <span className="text-gray-900 font-medium">ICD Implanted</span>
            </div>
          )}
        </div>
      </div>

      {/* Cardiac Procedures & Treatments */}
      {(history.cardiac_procedures && history.cardiac_procedures.length > 0) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            <span>Previous Cardiac Procedures & Treatments</span>
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="space-y-3">
              {history.cardiac_procedures.map((procedure, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <p className="font-semibold text-gray-900">{procedure}</p>
                      </div>
                      {history.last_cardiac_event_date && index === 0 && (
                        <p className="text-sm text-gray-600 ml-7">
                          Last event: {new Date(history.last_cardiac_event_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {history.last_cardiac_event_date && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Most Recent Cardiac Event:</strong> {new Date(history.last_cardiac_event_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Family History */}
      {history.family_cardiac_history && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Cardiac History</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Family history of cardiac issues present</p>
                {history.family_cardiac_details && (
                  <p className="text-gray-700">{history.family_cardiac_details}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors</h3>
        <div className="grid grid-cols-2 gap-4">
          <RiskFactorCard
            label="Hypertension"
            present={history.has_hypertension}
            date={history.hypertension_diagnosed_date}
          />
          <RiskFactorCard
            label="Diabetes"
            present={history.has_diabetes}
            details={history.diabetes_type}
          />
          <RiskFactorCard
            label="High Cholesterol"
            present={history.has_high_cholesterol}
            value={history.cholesterol_level ? `${history.cholesterol_level} mg/dL` : null}
          />
          <RiskFactorCard
            label="Smoking"
            present={history.smoker && history.smoker !== 'never'}
            details={history.smoker === 'current' ? 'Current Smoker' : history.smoker === 'former' ? 'Former Smoker' : 'Never Smoked'}
          />
        </div>
      </div>

      {/* Current Vitals */}
      {(history.resting_heart_rate || history.blood_pressure_systolic) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Vital Signs</h3>
          <div className="grid grid-cols-3 gap-4">
            {history.resting_heart_rate && (
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Resting Heart Rate</p>
                <p className="text-3xl font-bold text-blue-600">{history.resting_heart_rate}</p>
                <p className="text-xs text-gray-500">BPM</p>
              </div>
            )}
            {history.blood_pressure_systolic && (
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Blood Pressure</p>
                <p className="text-3xl font-bold text-red-600">
                  {history.blood_pressure_systolic}/{history.blood_pressure_diastolic}
                </p>
                <p className="text-xs text-gray-500">mmHg</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lifestyle */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifestyle & Habits</h3>
        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Exercise Frequency" value={history.exercise_frequency || 'Not specified'} />
          <InfoField label="Diet Type" value={history.diet_type || 'Standard'} />
          <InfoField label="Alcohol Consumption" value={history.alcohol_consumption || 'Not specified'} />
          <InfoField label="Sleep (hours/night)" value={history.sleep_hours_avg || 'Not tracked'} />
          {history.has_sleep_apnea && (
            <div className="col-span-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-900">Sleep Apnea Diagnosed</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Conditions */}
      {(history.has_kidney_disease || history.has_lung_disease || history.has_thyroid_disorder || (history.other_conditions && history.other_conditions.length > 0)) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Medical Conditions</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {history.has_kidney_disease && (
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-orange-600" />
                <span className="text-gray-900">Kidney Disease</span>
              </div>
            )}
            {history.has_lung_disease && (
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-orange-600" />
                <span className="text-gray-900">Lung Disease</span>
              </div>
            )}
            {history.has_thyroid_disorder && (
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-orange-600" />
                <span className="text-gray-900">Thyroid Disorder</span>
              </div>
            )}
            {history.other_conditions && history.other_conditions.map((condition, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-orange-600" />
                <span className="text-gray-900">{condition}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allergies & Dietary Restrictions */}
      {((history.allergies && history.allergies.length > 0) || (history.dietary_restrictions && history.dietary_restrictions.length > 0)) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Allergies & Dietary Restrictions</h3>
          <div className="grid grid-cols-2 gap-4">
            {history.allergies && history.allergies.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-900 mb-2">Allergies</p>
                <ul className="space-y-1">
                  {history.allergies.map((allergy, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-center space-x-2">
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{allergy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {history.dietary_restrictions && history.dietary_restrictions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium text-blue-900 mb-2">Dietary Restrictions</p>
                <ul className="space-y-1">
                  {history.dietary_restrictions.map((restriction, idx) => (
                    <li key={idx} className="text-sm text-blue-800">• {restriction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Physician Info */}
      {history.physician_name && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Physician</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-gray-900">{history.physician_name}</p>
            {history.physician_phone && <p className="text-gray-600">{history.physician_phone}</p>}
            {history.physician_email && <p className="text-gray-600">{history.physician_email}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const MedicationsTab = ({ medications, onUpdate }) => {
  if (!medications || medications.length === 0) {
    return (
      <div className="text-center py-12">
        <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medications Recorded</h3>
        <p className="text-gray-600 mb-4">Track your current medications for better health management</p>
        <button
          onClick={() => toast.info('Medication management feature coming soon!')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Medication</span>
        </button>
      </div>
    );
  }

  const currentMeds = medications.filter(m => m.is_current);
  const pastMeds = medications.filter(m => !m.is_current);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Current Medications</h3>
        <button
          onClick={() => toast.info('Medication management feature coming soon!')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Medication</span>
        </button>
      </div>

      {currentMeds.length > 0 ? (
        <div className="space-y-4">
          {currentMeds.map((med) => (
            <MedicationCard key={med.id} medication={med} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">No current medications</p>
      )}

      {pastMeds.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mt-8">Past Medications</h3>
          <div className="space-y-4 opacity-60">
            {pastMeds.map((med) => (
              <MedicationCard key={med.id} medication={med} isPast />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const BaselineECGsTab = ({ baselineECGs, onUpdate }) => {
  if (!baselineECGs || baselineECGs.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Baseline ECGs</h3>
        <p className="text-gray-600 mb-4">
          Upload previous ECG reports for comparison with current readings
        </p>
        <button
          onClick={() => toast.info('ECG upload feature coming soon!')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Upload Baseline ECG</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <DocumentTextIcon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">Baseline ECGs for Comparison</h4>
            <p className="text-sm text-purple-800">
              Previous ECG records serve as your personal health baseline. We compare your current ECG readings 
              against these baselines to identify any deviations or abnormalities. The "Active Baseline" ECG is 
              used for weekly abnormality analysis and trend detection.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Previous ECG Records</h3>
        <button
          onClick={() => toast.info('ECG upload feature coming soon!')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Upload New</span>
        </button>
      </div>

      {baselineECGs.map((ecg) => (
        <BaselineECGCard key={ecg.id} ecg={ecg} />
      ))}
    </div>
  );
};

const SymptomsTab = ({ symptoms, onUpdate }) => {
  if (!symptoms || symptoms.length === 0) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Symptoms Logged</h3>
        <p className="text-gray-600 mb-4">Track symptoms to help identify patterns and triggers</p>
        <button
          onClick={() => toast.info('Symptom logging feature coming soon!')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Log Symptom</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Symptoms</h3>
        <button
          onClick={() => toast.info('Symptom logging feature coming soon!')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Log Symptom</span>
        </button>
      </div>

      {symptoms.map((symptom) => (
        <SymptomCard key={symptom.id} symptom={symptom} />
      ))}
    </div>
  );
};

// ==================== HELPER COMPONENTS ====================

const InfoField = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-gray-900 font-medium">{value}</p>
  </div>
);

const ConditionBadge = ({ condition, present, date, details }) => {
  if (!present) return null;
  
  return (
    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
      <div className="flex items-center space-x-2">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
        <span className="text-gray-900 font-medium">{condition}</span>
        {details && <span className="text-gray-600 text-sm">({details})</span>}
      </div>
      {date && (
        <span className="text-gray-500 text-sm">
          {new Date(date).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};

const RiskFactorCard = ({ label, present, date, details, value }) => (
  <div className={`rounded-lg p-4 ${present ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium text-gray-900">{label}</span>
      {present ? (
        <CheckCircleIcon className="h-5 w-5 text-yellow-600" />
      ) : (
        <CheckCircleIcon className="h-5 w-5 text-green-600" />
      )}
    </div>
    <p className="text-sm text-gray-600">
      {present ? (details || 'Yes') : 'No'}
    </p>
    {value && <p className="text-sm text-gray-900 font-medium mt-1">{value}</p>}
    {date && (
      <p className="text-xs text-gray-500 mt-1">
        Since: {new Date(date).toLocaleDateString()}
      </p>
    )}
  </div>
);

const MedicationCard = ({ medication, isPast }) => (
  <div className={`bg-white border rounded-lg p-4 ${isPast ? 'border-gray-200' : 'border-blue-200'}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{medication.medication_name}</h4>
        {medication.generic_name && (
          <p className="text-sm text-gray-600">Generic: {medication.generic_name}</p>
        )}
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Dosage:</span> {medication.dosage} {medication.unit}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Frequency:</span> {medication.frequency}
          </p>
          {medication.purpose && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Purpose:</span> {medication.purpose}
            </p>
          )}
        </div>
      </div>
      {medication.is_current && (
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
          Active
        </span>
      )}
    </div>
    <div className="mt-3 text-xs text-gray-500">
      Started: {new Date(medication.start_date).toLocaleDateString()}
      {medication.end_date && ` • Ended: ${new Date(medication.end_date).toLocaleDateString()}`}
    </div>
  </div>
);

const BaselineECGCard = ({ ecg }) => (
  <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <DocumentTextIcon className="h-6 w-6 text-blue-600" />
          <h4 className="font-semibold text-gray-900 text-lg">
            {ecg.recording_facility || 'ECG Report'}
          </h4>
          {ecg.is_active_baseline && (
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
              ✓ Active Baseline
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center space-x-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(ecg.recording_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </span>
          {ecg.performing_physician && (
            <span className="flex items-center space-x-1">
              <UserCircleIcon className="h-4 w-4" />
              <span>Dr. {ecg.performing_physician}</span>
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => window.open(`/api/profile/baseline-ecgs/${ecg.id}/file`, '_blank')}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center space-x-2"
      >
        <DocumentTextIcon className="h-4 w-4" />
        <span>View Report</span>
      </button>
    </div>

    {/* ECG Parameters Grid */}
    {ecg.heart_rate && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Heart Rate</p>
          <p className="text-lg font-bold text-blue-600">{ecg.heart_rate}</p>
          <p className="text-xs text-gray-400">BPM</p>
        </div>
        {ecg.pr_interval && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">PR Interval</p>
            <p className="text-lg font-bold text-purple-600">{ecg.pr_interval}</p>
            <p className="text-xs text-gray-400">ms</p>
          </div>
        )}
        {ecg.qrs_duration && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">QRS Duration</p>
            <p className="text-lg font-bold text-green-600">{ecg.qrs_duration}</p>
            <p className="text-xs text-gray-400">ms</p>
          </div>
        )}
        {ecg.qt_interval && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">QT Interval</p>
            <p className="text-lg font-bold text-orange-600">{ecg.qt_interval}</p>
            <p className="text-xs text-gray-400">ms</p>
          </div>
        )}
      </div>
    )}

    {/* Interpretation */}
    {ecg.interpretation && (
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Clinical Interpretation</p>
        <p className="text-sm text-gray-800 leading-relaxed">{ecg.interpretation}</p>
      </div>
    )}

    {/* Abnormalities/Findings */}
    {ecg.abnormalities_detected && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-yellow-900 mb-2">⚠️ Abnormalities Detected</p>
        <p className="text-sm text-yellow-800">{ecg.abnormalities_detected}</p>
      </div>
    )}

    {/* Purpose/Notes */}
    {ecg.purpose && (
      <div className="mt-3 text-sm text-gray-600 italic">
        <span className="font-medium">Purpose:</span> {ecg.purpose}
      </div>
    )}

    {/* Use for Comparison Badge */}
    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
      <span className="text-xs text-gray-500">
        {ecg.is_active_baseline 
          ? '🔍 Used for weekly abnormality comparison' 
          : 'Historical record only'}
      </span>
      {ecg.uploaded_at && (
        <span className="text-xs text-gray-400">
          Uploaded: {new Date(ecg.uploaded_at).toLocaleDateString()}
        </span>
      )}
    </div>
  </div>
);

const SymptomCard = ({ symptom }) => {
  const getSeverityColor = (severity) => {
    if (severity <= 3) return 'green';
    if (severity <= 6) return 'yellow';
    return 'red';
  };

  const color = getSeverityColor(symptom.severity);

  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className={`h-6 w-6 text-${color}-600`} />
            <div>
              <h4 className="font-semibold text-gray-900 capitalize">
                {symptom.symptom_type.replace(/_/g, ' ')}
              </h4>
              <p className="text-sm text-gray-600">
                {new Date(symptom.recorded_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Severity:</span>
              <div className="flex space-x-1">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i < symptom.severity ? `bg-${color}-600` : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{symptom.severity}/10</span>
            </div>
            {symptom.duration_minutes && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Duration:</span> {symptom.duration_minutes} minutes
              </p>
            )}
            {symptom.triggers && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Triggers:</span> {symptom.triggers}
              </p>
            )}
            {symptom.notes && (
              <p className="text-sm text-gray-700 mt-2">{symptom.notes}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
