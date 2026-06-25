import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchPredictionById, clearPredictionDetail } from '../store/slices/predictionSlice';
import { fetchPatients } from '../store/slices/patientSlice';
import apiClient from '../api/client';
import { 
  ArrowLeft, 
  Clock, 
  Activity, 
  HeartPulse, 
  AlertCircle, 
  Loader2, 
  FileDown, 
  CheckCircle,
  User
} from 'lucide-react';

const PredictionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { currentPredictionDetail: pred, loading: predictionLoading, error } = useAppSelector((state) => state.predictions);
  const { items: patients, loading: patientsLoading } = useAppSelector((state) => state.patients);

  useEffect(() => {
    if (id) {
      dispatch(fetchPredictionById(id));
      if (patients.length === 0) {
        dispatch(fetchPatients());
      }
    }
    return () => {
      dispatch(clearPredictionDetail());
    };
  }, [dispatch, id, patients.length]);

  const getPatientProfile = () => {
    if (!pred) return null;
    return patients.find((p) => p.id === pred.patient_id) || null;
  };

  const getRiskLevelStyles = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' };
      case 'medium':
        return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
      default:
        return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
    }
  };

  const handleDownloadPDF = async () => {
    if (!pred) return;
    try {
      const response = await apiClient.get(`/reports/predictions/${pred.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Prediction_Report_${pred.id}.pdf`;
      link.click();
    } catch (err) {
      alert('Failed to generate and download PDF report.');
    }
  };

  const patient = getPatientProfile();
  const loading = predictionLoading || patientsLoading;

  if (loading && !pred) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to history
        </button>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!pred) return null;

  return (
    <div className="space-y-6">
      {/* Back Nav */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Brief summary card & Patient context */}
        <div className="lg:col-span-1 space-y-6">
          {/* Diagnostic Outcome Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col items-center text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Prediction Outcome</span>
            
            {/* Risk Gauge */}
            <div className="relative h-40 w-40 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e293b" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={
                    pred.risk_level === 'high' 
                      ? '#f43f5e' 
                      : pred.risk_level === 'medium' 
                      ? '#f59e0b' 
                      : '#10b981'
                  }
                  strokeWidth="8"
                  strokeDasharray={`${pred.probability * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="z-10 space-y-0.5">
                <p className="text-3xl font-extrabold text-white">
                  {(pred.probability).toLocaleString([], { style: 'percent', minimumFractionDigits: 1 })}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">probability</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${
                getRiskLevelStyles(pred.risk_level).bg
              } ${getRiskLevelStyles(pred.risk_level).text} ${getRiskLevelStyles(pred.risk_level).border}`}>
                {pred.risk_level} Risk Level
              </span>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 mt-2">
                <Clock className="h-3.5 w-3.5" />
                {new Date(pred.created_at).toLocaleString()}
              </p>
            </div>

            <div className="w-full pt-6 border-t border-slate-800">
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 text-sm"
              >
                <FileDown className="h-4 w-4 text-slate-400" />
                Download PDF Report
              </button>
            </div>
          </div>

          {/* Patient Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Patient Details</span>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">
                  {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                </p>
                <span className="text-xs text-slate-500 font-mono">
                  {patient ? patient.medical_identifier : pred.patient_id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inputs, Factors and Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clinical Inputs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Patient Clinical inputs</h3>
            
            {pred.disease_type === 'diabetes' && pred.diabetes_input ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Pregnancies</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.diabetes_input.pregnancies}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Glucose</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.diabetes_input.glucose} mg/dL</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Blood Pressure</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.diabetes_input.blood_pressure} mmHg</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Skin Thickness</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.diabetes_input.skin_thickness} mm</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Insulin</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.diabetes_input.insulin} mu U/ml</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">BMI</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.diabetes_input.bmi}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Pedigree Func</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.diabetes_input.diabetes_pedigree_function}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Age</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.diabetes_input.age}</span>
                </div>
              </div>
            ) : pred.disease_type === 'pcos' && pred.pcos_input ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Age</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.pcos_input.age}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">BMI</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.pcos_input.bmi}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Cycle Regularity</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.pcos_input.cycle_regularity ? 'Regular' : 'Irregular'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Clinical Acne</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.pcos_input.acne ? 'Present' : 'Absent'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Hair Loss</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.pcos_input.hair_loss ? 'Present' : 'Absent'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Hirsutism</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.pcos_input.hirsutism ? 'Present' : 'Absent'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Insulin Resistance</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.pcos_input.insulin_resistance}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">LH / FSH Ratio</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.pcos_input.lh_fsh_ratio}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[10px]">Follicle Size</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 block">{pred.pcos_input.follicle_size} mm</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/45 rounded-2xl">
                No clinical sign inputs recorded for this report.
              </div>
            )}
          </div>

          {/* Feature Impacts Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6">Diagnostic Feature Contributions</h3>
            
            <div className="space-y-4">
              {pred.shap_values.map((factor, index) => {
                const maxImpact = Math.max(...pred.shap_values.map((f) => Math.abs(f.shap_value)), 0.01);
                const widthPercent = `${(Math.abs(factor.shap_value) / maxImpact) * 100}%`;
                const isPositive = factor.direction === 'positive' || factor.shap_value > 0;

                // Help map variables
                let displayVal = `${factor.input_value}`;
                if (factor.feature_name === 'cycle_regularity') {
                  displayVal = factor.input_value === 0 ? 'Irregular' : 'Regular';
                } else if (['acne', 'hair_loss', 'hirsutism'].includes(factor.feature_name)) {
                  displayVal = factor.input_value === 1 ? 'Present' : 'Absent';
                }

                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300 capitalize">{factor.feature_name.replace(/_/g, ' ')} ({displayVal})</span>
                      <span className={`font-mono font-semibold ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isPositive ? '+' : ''}{factor.shap_value.toFixed(4)}
                      </span>
                    </div>
                    
                    <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                      <div 
                        style={{ width: widthPercent }}
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isPositive 
                            ? 'bg-gradient-to-r from-rose-600 to-rose-400' 
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6">Recommended Clinical Actions</h3>
            <div className="space-y-4">
              {pred.recommendations.map((rec) => (
                <div 
                  key={rec.id}
                  className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl flex gap-3"
                >
                  <CheckCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                      {rec.category}
                    </span>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PredictionDetail;
