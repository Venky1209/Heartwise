/**
 * Doctor Dashboard
 * Main dashboard for healthcare providers
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayConsultations: 0,
    pendingECGReviews: 0,
    activePrescriptions: 0,
    unreadResponses: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await api.get('/doctor/dashboard');
      setStats(statsResponse.data);

      // Fetch recent patients
      const patientsResponse = await api.get('/doctor/patients?limit=5');
      setRecentPatients(patientsResponse.data.patients || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <Link to={link} className="block">
      <div className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('border-', 'bg-')}`}>
            <Icon className={`w-8 h-8 ${color.replace('border-', 'text-')}`} />
          </div>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, Dr. {user?.profile?.last_name || user?.email}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={UserGroupIcon}
          color="border-blue-500"
          link="/doctor/patients"
        />
        <StatCard
          title="Today's Consultations"
          value={stats.todayConsultations}
          icon={CalendarIcon}
          color="border-green-500"
          link="/doctor/consultations"
        />
        <StatCard
          title="Pending ECG Reviews"
          value={stats.pendingECGReviews}
          icon={HeartIcon}
          color="border-red-500"
          link="/doctor/ecg-reviews"
        />
        <StatCard
          title="Active Prescriptions"
          value={stats.activePrescriptions}
          icon={ClipboardDocumentListIcon}
          color="border-purple-500"
          link="/doctor/prescriptions"
        />
        <StatCard
          title="Unread Responses"
          value={stats.unreadResponses}
          icon={BellAlertIcon}
          color="border-amber-500"
          link="/doctor/instructions"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/doctor/patients/assign"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <UserGroupIcon className="w-6 h-6 text-blue-600 mr-3" />
            <span className="font-medium text-gray-900">Add New Patient</span>
          </Link>
          <Link
            to="/doctor/prescriptions/new"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <ClipboardDocumentListIcon className="w-6 h-6 text-green-600 mr-3" />
            <span className="font-medium text-gray-900">Create Prescription</span>
          </Link>
          <Link
            to="/doctor/instructions/new"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <BellAlertIcon className="w-6 h-6 text-purple-600 mr-3" />
            <span className="font-medium text-gray-900">Send Instruction</span>
          </Link>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Patients</h2>
          <Link to="/doctor/patients" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            View All →
          </Link>
        </div>

        {recentPatients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No patients assigned yet</p>
            <Link to="/doctor/patients/assign" className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
              Assign your first patient
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ECG Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last ECG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {patient.profile_photo_url ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={patient.profile_photo_url}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {patient.first_name?.[0]}{patient.last_name?.[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Link
                            to={`/doctor/patients/${patient.patient_id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            {patient.first_name} {patient.last_name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.total_ecg_sessions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.last_ecg_date
                        ? new Date(patient.last_ecg_date).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        patient.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
