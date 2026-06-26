import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchDoctorHistory } from '../store/slices/predictionSlice';
import { fetchPatients } from '../store/slices/patientSlice';
import apiClient from '../api/client';
import {
  Activity,
  AlertCircle,
  Clock,
  Download,
  FileText,
  HeartPulse,
  Loader2,
  Search,
} from 'lucide-react';

const Reports: React.FC = () => {
  const dispatch = useAppDispatch();
  const { historyItems: predictions, loading: predictionsLoading, error } = useAppSelector((state) => state.predictions);
  const { items: patients, loading: patientsLoading } = useAppSelector((state) => state.patients);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dispatch(fetchDoctorHistory());
    if (patients.length === 0) {
      dispatch(fetchPatients());
    }
  }, [dispatch, patients.length]);

  const getPatient = (patientId: string) => patients.find((patient) => patient.id === patientId);

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
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Failed to generate and download PDF report.');
    }
  };

  const filteredReports = predictions.filter((prediction) => {
    const patient = getPatient(prediction.patient_id);
    const haystack = [
      prediction.id,
      prediction.disease_type,
      prediction.risk_level,
      patient?.first_name,
      patient?.last_name,
      patient?.medical_identifier,
    ].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const loading = predictionsLoading || patientsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            <FileText className="h-7 w-7 text-blue-600 dark:text-blue-300" />
            Generated PDF Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Download report PDFs created from completed prediction records.
          </p>
        </div>
        <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
          {predictions.length} reports
        </div>
      </div>

      <div className="clinical-card p-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by patient, disease, risk, or report ID..."
            className="clinical-input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-300" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="clinical-empty">
          No generated PDF reports match the current search.
        </div>
      ) : (
        <div className="clinical-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                <tr>
                  <th className="px-6 py-4">Report</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Risk</th>
                  <th className="px-6 py-4">Generated</th>
                  <th className="px-6 py-4 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredReports.map((prediction) => {
                  const patient = getPatient(prediction.patient_id);
                  return (
                    <tr key={prediction.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <Link to={`/predictions/${prediction.id}`} className="flex items-center gap-2 font-semibold capitalize text-slate-950 hover:text-blue-700 dark:text-white dark:hover:text-blue-300">
                          {prediction.disease_type === 'diabetes' ? (
                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          ) : (
                            <HeartPulse className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          )}
                          {prediction.disease_type} prediction
                        </Link>
                        <p className="mt-1 font-mono text-xs text-slate-500">{prediction.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{patient?.medical_identifier || prediction.patient_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
                          {prediction.risk_level} risk
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(prediction.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadPDF(prediction.id)}
                          className="clinical-button-secondary"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
