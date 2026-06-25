import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchPatientById } from '../store/slices/patientSlice';
import { fetchPatientHistory } from '../store/slices/predictionSlice';
import apiClient from '../api/client';
import {
  ArrowLeft,
  Calendar,
  Phone,
  FileText,
  Activity,
  HeartPulse,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  Download,
  ClipboardList,
  CheckCircle,
} from 'lucide-react';

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentPatient, loading: patientLoading, error: patientError } = useAppSelector((state) => state.patients);
  const { historyItems: predictions, loading: historyLoading, error: historyError } = useAppSelector((state) => state.predictions);

  useEffect(() => {
    if (id) {
      dispatch(fetchPatientById(id));
      dispatch(fetchPatientHistory({ patientId: id }));
    }
  }, [dispatch, id]);

  const sortedPredictions = [...predictions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const latestPrediction = sortedPredictions[0];

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300';
      case 'medium':
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300';
      default:
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300';
    }
  };

  const calculateAge = (dobString: string) => {
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleDownloadPDF = async (predictionId: string) => {
    try {
      const response = await apiClient.get(`/reports/predictions/${predictionId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Prediction_Report_${predictionId}.pdf`;
      link.click();
    } catch (err) {
      alert('Failed to generate and download PDF report.');
    }
  };

  const latestInputs = latestPrediction?.diabetes_input || latestPrediction?.pcos_input || null;
  const inputEntries = latestInputs ? Object.entries(latestInputs) : [];
  const loading = patientLoading || historyLoading;
  const error = patientError || historyError;

  if (loading && !currentPatient) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/patients')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4" /> Back to registry
        </button>
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!currentPatient) return null;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/patients')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300">
        <ArrowLeft className="h-4 w-4" /> Back to patient registry
      </button>

      <div className="clinical-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Patient Details</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              {currentPatient.first_name} {currentPatient.last_name}
            </h1>
            <p className="mt-2 font-mono text-sm text-slate-500">{currentPatient.medical_identifier}</p>
          </div>
          {latestPrediction ? (
            <div className={`rounded-2xl border px-4 py-3 ${getRiskColor(latestPrediction.risk_level)}`}>
              <p className="text-xs font-semibold uppercase">Latest Risk Level</p>
              <p className="mt-1 text-2xl font-bold capitalize">{latestPrediction.risk_level}</p>
              <p className="mt-1 text-xs">
                {latestPrediction.probability.toLocaleString([], { style: 'percent', minimumFractionDigits: 1 })} probability
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase">Latest Risk Level</p>
              <p className="mt-1 text-sm">No prediction recorded</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="clinical-panel">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Personal Information</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>{new Date(currentPatient.date_of_birth).toLocaleDateString()} ({calculateAge(currentPatient.date_of_birth)} years old)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="capitalize">Gender: {currentPatient.gender}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Phone className="h-4 w-4 text-slate-500" />
                <span>{currentPatient.phone || 'No phone recorded'}</span>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase text-slate-500">Clinical Notes</p>
              <div className="mt-2 min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                {currentPatient.notes || 'No clinical remarks recorded for this patient profile.'}
              </div>
            </div>
          </div>

          <div className="clinical-panel">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Diagnostic Actions</h2>
            <div className="mt-5 grid grid-cols-1 gap-3">
              <button onClick={() => navigate('/predict/diabetes', { state: { patientId: currentPatient.id } })} className="clinical-button-secondary justify-start">
                <Activity className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                Diabetes Prediction
              </button>
              <button onClick={() => navigate('/predict/pcos', { state: { patientId: currentPatient.id } })} className="clinical-button-secondary justify-start">
                <HeartPulse className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                PCOS Prediction
              </button>
              {latestPrediction && (
                <button onClick={() => handleDownloadPDF(latestPrediction.id)} className="clinical-button-primary justify-start">
                  <Download className="h-5 w-5" />
                  Download Latest PDF
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {latestPrediction && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="clinical-panel">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
                  <ClipboardList className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                  Clinical Inputs
                </h2>
                {inputEntries.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                    No clinical inputs returned for the latest report.
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {inputEntries.slice(0, 8).map(([key, value]) => (
                      <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                        <p className="text-[10px] font-semibold uppercase text-slate-500">{key.replace(/_/g, ' ')}</p>
                        <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="clinical-panel">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  Recommendations
                </h2>
                {latestPrediction.recommendations.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                    No recommendations returned for the latest report.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {latestPrediction.recommendations.slice(0, 3).map((rec) => (
                      <div key={rec.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                        <p className="text-[10px] font-semibold uppercase text-blue-700 dark:text-blue-300">{rec.category}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="clinical-panel">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Prediction History</h2>
            {sortedPredictions.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500 dark:border-slate-800">
                No past prediction reports found for this patient.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                    <tr>
                      <th className="py-3 pr-4">Prediction</th>
                      <th className="py-3 pr-4">Risk</th>
                      <th className="py-3 pr-4">Probability</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {sortedPredictions.map((pred) => (
                      <tr key={pred.id}>
                        <td className="py-4 pr-4">
                          <span className="flex items-center gap-2 font-medium capitalize text-slate-900 dark:text-slate-100">
                            {pred.disease_type === 'diabetes' ? <Activity className="h-4 w-4 text-blue-700 dark:text-blue-300" /> : <HeartPulse className="h-4 w-4 text-blue-700 dark:text-blue-300" />}
                            {pred.disease_type}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getRiskColor(pred.risk_level)}`}>
                            {pred.risk_level}
                          </span>
                        </td>
                        <td className="py-4 pr-4 font-semibold text-slate-950 dark:text-white">
                          {pred.probability.toLocaleString([], { style: 'percent', minimumFractionDigits: 1 })}
                        </td>
                        <td className="py-4 pr-4 text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(pred.created_at).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleDownloadPDF(pred.id)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-300" title="Download PDF report">
                              <Download className="h-4 w-4" />
                            </button>
                            <Link to={`/predictions/${pred.id}`} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/10">
                              Details
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
