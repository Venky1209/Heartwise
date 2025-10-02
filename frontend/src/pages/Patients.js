import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPatients: 0
  });

  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    medicalHistory: ''
  });

  useEffect(() => {
    fetchPatients();
  }, [pagination.currentPage]);

  const fetchPatients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      let url = `http://localhost:5001/api/patients?page=${page}&limit=10`;
      
      if (search) {
        url = `http://localhost:5001/api/patients/search/${encodeURIComponent(search)}`;
      }
      
      const response = await axios.get(url);
      
      if (search) {
        setPatients(response.data);
        setPagination({ currentPage: 1, totalPages: 1, totalPatients: response.data.length });
      } else {
        setPatients(response.data.patients || []);
        setPagination(response.data.pagination || { currentPage: 1, totalPages: 1, totalPatients: 0 });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchPatients(1, searchTerm);
    } else {
      fetchPatients(1);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchPatients(1);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!newPatient.firstName || !newPatient.lastName) {
        toast.error('Please enter first and last name');
        return;
      }
      if (!newPatient.dateOfBirth) {
        toast.error('Please select date of birth');
        return;
      }
      if (!newPatient.gender) {
        toast.error('Please select gender');
        return;
      }

      // Clean up data - convert empty strings to undefined for optional fields
      const patientData = {
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        dateOfBirth: newPatient.dateOfBirth,
        gender: newPatient.gender,
        email: newPatient.email || undefined,
        phone: newPatient.phone || undefined,
        medicalHistory: newPatient.medicalHistory || undefined
      };

      console.log('Submitting patient data:', patientData);
      const response = await axios.post('http://localhost:5001/api/patients', patientData);
      console.log('Patient added successfully:', response.data);
      
      setShowAddModal(false);
      setNewPatient({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        phone: '',
        medicalHistory: ''
      });
      
      toast.success('Patient added successfully');
      fetchPatients();
    } catch (error) {
      console.error('Error adding patient:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 409) {
        toast.error('Email already exists');
      } else if (error.response?.status === 400) {
        const details = error.response?.data?.details;
        if (details && Array.isArray(details)) {
          toast.error(`Validation error: ${details.join(', ')}`);
        } else {
          toast.error(`Validation error: ${error.response?.data?.error || 'Please check all required fields'}`);
        }
      } else {
        toast.error('Failed to add patient');
      }
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`http://localhost:5001/api/patients/${editingPatient.id}`, editingPatient);
      
      setEditingPatient(null);
      toast.success('Patient updated successfully');
      fetchPatients();
    } catch (error) {
      console.error('Error updating patient:', error);
      if (error.response?.status === 409) {
        toast.error('Email already exists');
      } else {
        toast.error('Failed to update patient');
      }
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    if (!window.confirm(`Are you sure you want to delete ${patientName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:5001/api/patients/${patientId}`);
      toast.success('Patient deleted successfully');
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading && patients.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="mt-2 text-gray-600">Manage patient information and medical records</p>
        </div>
        
        <div className="medical-card">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="mt-2 text-gray-600">
              Manage patient information and medical records
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="medical-card mb-6">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients by name or email..."
              className="form-input pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          {searchTerm && (
            <button type="button" onClick={clearSearch} className="btn-secondary">
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Patients List */}
      <div className="medical-card">
        {patients.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Contact</th>
                    <th>Last Session</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium text-sm">
                                {patient.first_name[0]}{patient.last_name[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Link 
                              to={`/patients/${patient.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-primary-600"
                            >
                              {patient.first_name} {patient.last_name}
                            </Link>
                            <p className="text-sm text-gray-500">
                              Born: {formatDate(patient.date_of_birth)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-900">
                          {calculateAge(patient.date_of_birth)} years
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-gray-900 capitalize">
                          {patient.gender}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm text-gray-900">
                          {patient.email && (
                            <p className="truncate max-w-xs">{patient.email}</p>
                          )}
                          {patient.phone && (
                            <p className="text-gray-500">{patient.phone}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-500">
                          {patient.last_session_date 
                            ? formatDate(patient.last_session_date)
                            : 'No sessions'
                          }
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/patients/${patient.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <HeartIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setEditingPatient(patient)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePatient(
                              patient.id, 
                              `${patient.first_name} ${patient.last_name}`
                            )}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages} 
                  ({pagination.totalPatients} total patients)
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchPatients(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchPatients(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding a new patient.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 btn-primary"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Add Your First Patient
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Patient</h3>
            
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    required
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient({...newPatient, dateOfBirth: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">Gender</label>
                <select
                  required
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                  className="form-input"
                >
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Email (Optional)</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">Phone (Optional)</label>
                <input
                  type="tel"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">
                  Add Patient
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Patient</h3>
            
            <form onSubmit={handleEditPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.first_name}
                    onChange={(e) => setEditingPatient({...editingPatient, first_name: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.last_name}
                    onChange={(e) => setEditingPatient({...editingPatient, last_name: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={editingPatient.date_of_birth}
                  onChange={(e) => setEditingPatient({...editingPatient, date_of_birth: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">Gender</label>
                <select
                  required
                  value={editingPatient.gender}
                  onChange={(e) => setEditingPatient({...editingPatient, gender: e.target.value})}
                  className="form-input"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={editingPatient.email || ''}
                  onChange={(e) => setEditingPatient({...editingPatient, email: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={editingPatient.phone || ''}
                  onChange={(e) => setEditingPatient({...editingPatient, phone: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">
                  Update Patient
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingPatient(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;