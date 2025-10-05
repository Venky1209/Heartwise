/**
 * Profile Completion Wizard
 * Multi-step onboarding form for new users
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  HeartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ProfileComplete = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    bloodType: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA'
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en'
  });

  const steps = [
    { id: 1, name: 'Personal Info', icon: UserCircleIcon },
    { id: 2, name: 'Complete', icon: CheckCircleIcon }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/profile/complete', formData);
      toast.success('Profile completed successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error(error.response?.data?.error || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <HeartIcon className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Let's set up your health profile to get started with ECG monitoring
          </p>
        </div>

        {/* Progress Steps */}
        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center justify-center space-x-5">
            {steps.map((step, index) => (
              <li key={step.name} className="flex items-center">
                {index !== 0 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id - 1 ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                )}
                <div className="relative flex flex-col items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2
                    ${currentStep >= step.id 
                      ? 'bg-red-500 border-red-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-500'
                    }
                  `}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="mt-2 text-xs font-medium text-gray-500">
                    {step.name}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>

        {/* Form Card */}
        <div className="bg-white shadow rounded-lg p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* DOB and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Height and Weight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => handleInputChange('heightCm', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="170"
                      min="0"
                      max="300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weightKg}
                      onChange={(e) => handleInputChange('weightKg', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="70"
                      min="0"
                      max="500"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Type
                    </label>
                    <select
                      value={formData.bloodType}
                      onChange={(e) => handleInputChange('bloodType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Address */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900">Address (Optional)</h3>
                  
                  <div>
                    <input
                      type="text"
                      value={formData.address.line1}
                      onChange={(e) => handleNestedInputChange('address', 'line1', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="State"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.address.postalCode}
                      onChange={(e) => handleNestedInputChange('address', 'postalCode', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="ZIP Code"
                    />
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) => handleNestedInputChange('address', 'country', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Country"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900">Emergency Contact (Optional)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={formData.emergencyContact.name}
                      onChange={(e) => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Contact name"
                    />
                    <input
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Contact phone"
                    />
                    <input
                      type="text"
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Relationship"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Review and Submit */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Your Information</h2>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{formData.dateOfBirth}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium capitalize">{formData.gender}</p>
                    </div>
                    {formData.bloodType && (
                      <div>
                        <p className="text-sm text-gray-500">Blood Type</p>
                        <p className="font-medium">{formData.bloodType}</p>
                      </div>
                    )}
                    {formData.heightCm && (
                      <div>
                        <p className="text-sm text-gray-500">Height</p>
                        <p className="font-medium">{formData.heightCm} cm</p>
                      </div>
                    )}
                    {formData.weightKg && (
                      <div>
                        <p className="text-sm text-gray-500">Weight</p>
                        <p className="font-medium">{formData.weightKg} kg</p>
                      </div>
                    )}
                  </div>

                  {formData.phone && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{formData.phone}</p>
                    </div>
                  )}

                  {formData.emergencyContact.name && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">Emergency Contact</p>
                      <p className="font-medium">
                        {formData.emergencyContact.name} ({formData.emergencyContact.relationship}) - {formData.emergencyContact.phone}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can add medical history, medications, and baseline ECGs later from your profile page.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg font-medium ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip for now and go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileComplete;
