import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { registerUser, clearError } from '../store/slices/authSlice';
import { HeartPulse, Mail, Lock, UserCheck, Loader2, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient' | 'admin'>('doctor');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(registerUser({ email, password, role }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/50">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <HeartPulse className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Create MedPredict account</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Get started with secure clinical access
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

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
                placeholder="doctor@medpredict.com"
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
            <label className="clinical-label">Access Role</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <UserCheck className="h-5 w-5" />
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="clinical-input appearance-none pl-11"
              >
                <option value="doctor">Doctor (Clinical Diagnostics)</option>
                <option value="patient">Patient (View History)</option>
                <option value="admin">Admin (Platform Control)</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="clinical-button-primary mt-8 w-full py-3">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">Already have an account? </span>
          <Link
            to="/login"
            className="font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
