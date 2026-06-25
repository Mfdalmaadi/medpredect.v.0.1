import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="p-4 bg-rose-500/10 text-rose-500 rounded-3xl border border-rose-500/20 shadow-lg">
        <ShieldAlert className="h-16 w-16" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-bold text-white">Access Restricted</h1>
        <p className="text-slate-400 text-sm">
          You do not have the required clinical permissions to view this diagnostic module.
        </p>
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm transition-all duration-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </button>
    </div>
  );
};

export default Unauthorized;
