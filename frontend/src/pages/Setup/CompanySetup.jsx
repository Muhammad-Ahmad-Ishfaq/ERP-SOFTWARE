// src/pages/Setup/CompanySetup.jsx
import AddCompanyModal from '@/components/Company/AddCompanyModal';
import React from 'react';
import { useNavigate } from 'react-router-dom';


const CompanySetup = () => {
  const navigate = useNavigate();

  const handleSave = () => {
    // After company is created, go to register user page
    navigate('/setup/register');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xs shadow-2xl p-4">
        <h1 className="text-2xl font-bold text-orange-600 text-center mb-2">Create Company</h1>
        <p className="text-orange-500 text-center mb-3">Set up your company information to get started</p>
        <AddCompanyModal
          open={true}
          onOpenChange={() => {}}
          onSave={handleSave}
          editingCompany={null}
          isStandalone={true}
        />
      </div>
    </div>
  );
};

export default CompanySetup;