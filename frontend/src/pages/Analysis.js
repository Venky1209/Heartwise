import React from 'react';

const Analysis = () => {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ECG Analysis</h1>
        <p className="mt-2 text-gray-600">AI-powered ECG analysis and insights</p>
      </div>

      <div className="medical-card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Analysis Dashboard</h3>
          <p className="mt-2 text-gray-600">
            This page will display AI analysis results, abnormality detection, and medical insights.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;