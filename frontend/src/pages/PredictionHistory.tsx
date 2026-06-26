import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchDoctorHistory } from '../store/slices/predictionSlice';
import { fetchPatients } from '../store/slices/patientSlice';
import { 
  History, 
  Search, 
  ChevronRight, 
  Clock, 
  Activity, 
  HeartPulse, 
  AlertCircle, 
  Loader2,
  FileDown
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../api/client';

const PredictionHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { historyItems: predictions, historyTotal, loading: historyLoading, error: historyError } = useAppSelector((state) => state.predictions);
  const { items: patients, loading: patientsLoading } = useAppSelector((state) => state.patients);
  const { user } = useAppSelector((state) => state.auth);

  const [typeFilter, setTypeFilter] = useState<'all' | 'diabetes' | 'pcos'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchDoctorHistory());
    if (patients.length === 0) {
      dispatch(fetchPatients());
    }
  }, [dispatch, patients.length]);

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
  };

  const getPatientIdentifier = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? patient.medical_identifier : '-';
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/25';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
    }
  };

  const handleDownloadPDF = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await apiClient.get(`/reports/predictions/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Prediction_Report_${id}.pdf`;
      link.click();
    } catch (err) {
      alert('Failed to generate and download PDF report.');
    }
  };

  const filteredPredictions = predictions.filter((pred) => {
    const typeMatch = typeFilter === 'all' || pred.disease_type === typeFilter;
    const riskMatch = riskFilter === 'all' || pred.risk_level === riskFilter;
    
    const pName = getPatientName(pred.patient_id).toLowerCase();
    const pId = getPatientIdentifier(pred.patient_id).toLowerCase();
    const query = searchQuery.toLowerCase();
    const searchMatch = !searchQuery || pName.includes(query) || pId.includes(query);

    return typeMatch && riskMatch && searchMatch;
  });

  const loading = historyLoading || patientsLoading;
  const error = historyError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          <History className="h-7 w-7 text-blue-600 dark:text-blue-300" />
          Predictions
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Prediction history for completed patient assessments and clinical explanations.</p>
      </div>

      {/* Filters Toolbar */}
      <div className="clinical-card flex flex-col gap-4 p-4 md:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search patient name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clinical-input pl-9"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase">Diagnostic</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="clinical-input pr-8 text-xs"
          >
            <option value="all">All Diseases</option>
            <option value="diabetes">Diabetes Only</option>
            <option value="pcos">PCOS Only</option>
          </select>
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase">Risk</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="clinical-input pr-8 text-xs"
          >
            <option value="all">All Risks</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      {/* Main content table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="clinical-empty">
          No past predictions found matching current filters.
        </div>
      ) : (
        <div className="clinical-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                  <th className="px-6 py-4">Patient Record</th>
                  <th className="px-6 py-4">Diagnostic Assessment</th>
                  <th className="px-6 py-4">Run Date</th>
                  <th className="px-6 py-4">Risk Probability</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4 text-right">Report Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 dark:divide-slate-800/70 dark:text-slate-300">
                {filteredPredictions.map((pred) => (
                  <tr 
                    key={pred.id} 
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-950 dark:text-white">{getPatientName(pred.patient_id)}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{getPatientIdentifier(pred.patient_id)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2">
                        {pred.disease_type === 'diabetes' ? (
                          <Activity className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <HeartPulse className="h-4 w-4 text-pink-400" />
                        )}
                        <span className="capitalize">{pred.disease_type}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5 text-slate-600" />
                        {new Date(pred.created_at).toLocaleDateString()} {new Date(pred.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-950 dark:text-white">
                      {(pred.probability).toLocaleString([], { style: 'percent', minimumFractionDigits: 1 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getRiskColor(pred.risk_level)}`}>
                        {pred.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDownloadPDF(e, pred.id)}
                          className="p-2 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Download PDF report"
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                        <RouterLink
                          to={`/predictions/${pred.id}`}
                          className="flex items-center gap-1 py-1.5 px-3 bg-slate-950/40 hover:bg-indigo-600 hover:text-white rounded-lg border border-slate-800 hover:border-indigo-500 transition-all duration-300 text-xs text-slate-400"
                        >
                          Report
                          <ChevronRight className="h-3.5 w-3.5" />
                        </RouterLink>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionHistory;
