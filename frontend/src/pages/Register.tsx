import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { registerUser, clearError, clearRegistrationMessage } from '../store/slices/authSlice';
import { HeartPulse, Mail, Lock, Loader2, AlertCircle, BadgeCheck, Building2, BriefcaseMedical, CheckCircle2 } from 'lucide-react';
import AuthShell from '../components/AuthShell';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospital, setHospital] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error, registrationMessage } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearRegistrationMessage());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !specialization || !licenseNumber || !hospital) return;

    dispatch(
      registerUser({
        email,
        password,
        role: 'doctor',
        specialization,
        license_number: licenseNumber,
        hospital,
      })
    );
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <HeartPulse className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Create Doctor Account
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Register as a healthcare professional to access MedPredict.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {registrationMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{registrationMessage}</p>
              <p className="mt-1 text-emerald-600 dark:text-emerald-400">
                You can sign in after an administrator activates your account.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Doctor Registration Only</strong>
          </p>

          <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
            MedPredict is intended for healthcare professionals.
            Administrator accounts are created internally by the system.
            Patients are managed by doctors and do not create application accounts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="clinical-label">Email Address</label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-5 w-5" />
              </span>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                className="clinical-input pl-11"
              />
            </div>
          </div>

          <div>
            <label className="clinical-label">Password</label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-5 w-5" />
              </span>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="clinical-input pl-11"
              />
            </div>
          </div>

          <div>
            <label className="clinical-label">Specialization</label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <BriefcaseMedical className="h-5 w-5" />
              </span>

              <input
                type="text"
                required
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Endocrinology"
                className="clinical-input pl-11"
              />
            </div>
          </div>

          <div>
            <label className="clinical-label">License Number</label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <BadgeCheck className="h-5 w-5" />
              </span>

              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="LIC-123456"
                className="clinical-input pl-11"
              />
            </div>
          </div>

          <div>
            <label className="clinical-label">Hospital</label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Building2 className="h-5 w-5" />
              </span>

              <input
                type="text"
                required
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="Central Hospital"
                className="clinical-input pl-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="clinical-button-primary mt-8 w-full py-3"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Doctor Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">
            Already have an account?{' '}
          </span>

          <Link
            to="/login"
            className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default Register;
