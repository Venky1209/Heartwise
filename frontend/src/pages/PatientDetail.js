import React from 'react';
import { useParams } from 'react-router-dom';

const PatientDetail = () => {
  const { id } = useParams();

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
        <p className="mt-2 text-gray-600">Detailed patient information and medical history</p>
      </div>

      <div className="medical-card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Patient Detail View</h3>
          <p className="mt-2 text-gray-600">Patient ID: {id}</p>
          <p className="mt-1 text-sm text-gray-500">
            This page will show detailed patient information, ECG history, and analysis results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;