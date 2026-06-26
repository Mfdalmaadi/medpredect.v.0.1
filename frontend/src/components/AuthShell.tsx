import React from 'react';
import { Activity, CheckCircle2, ClipboardList, HeartPulse, ShieldCheck } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
}

const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/50 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex flex-col justify-between bg-blue-50 p-8 text-slate-950 dark:bg-slate-950 dark:text-white lg:p-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">MedPredict</h1>
                <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Clinical decision support</p>
              </div>
            </div>

            <div className="mt-12 max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Hospital-ready prediction workflows for clinical teams.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Manage patients, run supported diagnostic predictions, review SHAP explanations, and export PDF reports from one secure care workspace.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { icon: ClipboardList, label: 'Patient-centered workflow' },
                { icon: Activity, label: 'Risk prediction records' },
                { icon: ShieldCheck, label: 'Role-based access' },
                { icon: CheckCircle2, label: 'PDF clinical reports' },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.label} className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white/70 p-3 text-sm font-semibold text-slate-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-slate-200">
                    <Icon className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                    {feature.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-blue-200 bg-white p-5 dark:border-blue-500/20 dark:bg-slate-900">
            <svg viewBox="0 0 520 220" role="img" aria-label="Healthcare workstation illustration" className="h-auto w-full">
              <rect x="20" y="34" width="235" height="150" rx="14" fill="currentColor" className="text-white dark:text-slate-800" />
              <rect x="45" y="62" width="125" height="12" rx="6" fill="#2563eb" />
              <rect x="45" y="88" width="180" height="10" rx="5" fill="#bfdbfe" />
              <rect x="45" y="112" width="150" height="10" rx="5" fill="#dbeafe" />
              <path d="M54 150h38l10-24 17 43 17-29h61" fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="348" cy="92" r="42" fill="#dbeafe" />
              <path d="M348 62v60M318 92h60" stroke="#2563eb" strokeWidth="16" strokeLinecap="round" />
              <rect x="298" y="144" width="160" height="40" rx="12" fill="#eff6ff" />
              <rect x="318" y="158" width="74" height="10" rx="5" fill="#2563eb" />
              <rect x="404" y="158" width="34" height="10" rx="5" fill="#93c5fd" />
            </svg>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          {children}
        </section>
      </div>
    </div>
  );
};

export default AuthShell;
