import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchPatients } from '../store/slices/patientSlice';
import { predictDiabetes, clearActivePrediction } from '../store/slices/predictionSlice';
import apiClient from '../api/client';
import { 
  Activity, 
  User, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  CheckCircle,
  HelpCircle,
  FileDown
} from 'lucide-react';

const PredictDiabetes: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve patientId from location state if navigation came from Patient Detail page
  const routePatientId = location.state?.patientId as string | undefined;

  const { items: patients, loading: patientsLoading } = useAppSelector((state) => state.patients);
  const { activePrediction, loading: predicting, error } = useAppSelector((state) => state.predictions);

  const [selectedPatientId, setSelectedPatientId] = useState(routePatientId || '');
  
  // Form Fields
  const [pregnancies, setPregnancies] = useState('0');
  const [glucose, setGlucose] = useState('120');
  const [bloodPressure, setBloodPressure] = useState('80');
  const [skinThickness, setSkinThickness] = useState('20');
  const [insulin, setInsulin] = useState('80');
  const [bmi, setBmi] = useState('25.0');
  const [pedigree, setPedigree] = useState('0.5');
  const [age, setAge] = useState('30');

  useEffect(() => {
    dispatch(clearActivePrediction());
    if (patients.length === 0) {
      dispatch(fetchPatients());
    }
  }, [dispatch, patients.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    const payload = {
      patient_id: selectedPatientId,
      clinical_input: {
        pregnancies: parseInt(pregnancies),
        glucose: parseFloat(glucose),
        blood_pressure: parseFloat(bloodPressure),
        skin_thickness: parseFloat(skinThickness),
        insulin: parseFloat(insulin),
        bmi: parseFloat(bmi),
        diabetes_pedigree_function: parseFloat(pedigree),
        age: parseInt(age),
      },
    };

    dispatch(predictDiabetes(payload));
  };

  const handleDownloadPDF = async () => {
    if (!activePrediction) return;
    try {
      const response = await apiClient.get(`/reports/predictions/${activePrediction.prediction_id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Prediction_Report_${activePrediction.prediction_id}.pdf`;
      link.click();
    } catch (err) {
      alert('Failed to generate and download PDF report.');
    }
  };

  const getRiskLevelStyles = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return { text: 'text-rose-400', border: 'border-rose-500/30', ring: 'ring-rose-500/20', bg: 'bg-rose-500/10' };
      case 'medium':
        return { text: 'text-amber-400', border: 'border-amber-500/30', ring: 'ring-amber-500/20', bg: 'bg-amber-500/10' };
      default:
        return { text: 'text-emerald-400', border: 'border-emerald-500/30', ring: 'ring-emerald-500/20', bg: 'bg-emerald-500/10' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="h-7 w-7 text-emerald-500" />
          Diabetes Risk Assessment
        </h1>
        <p className="text-slate-400 text-sm mt-1">Submit patient clinical signs to check diabetes probability (ML + SHAP explainability)</p>
      </div>

      {!activePrediction ? (
        /* Form view */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Patient Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Evaluate Patient
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="h-5 w-5" />
                </span>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:border-indigo-500 appearance-none text-sm"
                  disabled={!!routePatientId}
                >
                  <option value="" disabled className="text-slate-600">Select a patient profile...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900">
                      {p.first_name} {p.last_name} ({p.medical_identifier})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Pregnancies */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Pregnancies
                  <span className="text-[10px] text-slate-500 capitalize">(0 - 30)</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="30"
                  value={pregnancies}
                  onChange={(e) => setPregnancies(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Glucose */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Glucose (mg/dL)
                  <span className="text-[10px] text-slate-500 capitalize">(0 - 400)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  max="400"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Blood Pressure */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Blood Pressure (mmHg)
                  <span className="text-[10px] text-slate-500 capitalize">(0 - 250)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  max="250"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Skin Thickness */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Triceps Skin Fold Thickness (mm)
                  <span className="text-[10px] text-slate-500 capitalize">(0 - 150)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  max="150"
                  value={skinThickness}
                  onChange={(e) => setSkinThickness(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Insulin */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  2-Hour Serum Insulin (mu U/ml)
                  <span className="text-[10px] text-slate-500 capitalize">(0 - 1000)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  max="1000"
                  value={insulin}
                  onChange={(e) => setInsulin(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* BMI */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Body Mass Index (BMI)
                  <span className="text-[10px] text-slate-500 capitalize">(0 - 100)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  max="100"
                  value={bmi}
                  onChange={(e) => setBmi(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Pedigree */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Diabetes Pedigree Function
                  <span className="text-[10px] text-slate-500 capitalize">(0.0 - 5.0)</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  min="0"
                  max="5"
                  value={pedigree}
                  onChange={(e) => setPedigree(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Age */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Age (Years)
                  <span className="text-[10px] text-slate-500 capitalize">(1 - 120)</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-400 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={predicting}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow shadow-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm"
              >
                {predicting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating ML Risk...
                  </>
                ) : (
                  <>
                    Evaluate Patient
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Results View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Diagnostic overview */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col items-center text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Evaluation Outcome</span>
            
            {/* Risk Gauge */}
            <div className="relative h-44 w-44 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e293b" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={
                    activePrediction.risk_level === 'high' 
                      ? '#f43f5e' 
                      : activePrediction.risk_level === 'medium' 
                      ? '#f59e0b' 
                      : '#10b981'
                  }
                  strokeWidth="8"
                  strokeDasharray={`${activePrediction.probability * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="z-10 space-y-0.5">
                <p className="text-3xl font-extrabold text-white">
                  {(activePrediction.probability).toLocaleString([], { style: 'percent', minimumFractionDigits: 1 })}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">probability</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${
                getRiskLevelStyles(activePrediction.risk_level).bg
              } ${getRiskLevelStyles(activePrediction.risk_level).text} ${getRiskLevelStyles(activePrediction.risk_level).border}`}>
                {activePrediction.risk_level} Risk Level
              </span>
              <p className="text-xs text-slate-400 max-w-64 leading-relaxed pt-2">
                This calculation represents statistical correlation. This is not a diagnosis.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="w-full space-y-3 pt-6 border-t border-slate-800">
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 text-sm"
              >
                <FileDown className="h-4 w-4 text-slate-400" />
                Download PDF Report
              </button>
              <button
                onClick={() => dispatch(clearActivePrediction())}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow shadow-indigo-600/10"
              >
                Evaluate Another
              </button>
            </div>
          </div>

          {/* Detailed results (SHAP & recommendations) */}
          <div className="lg:col-span-2 space-y-6">
            {/* SHAP Chart panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">SHAP Clinical Feature Impact</h3>
              
              <div className="space-y-4">
                {activePrediction.top_factors.map((factor, index) => {
                  const maxImpact = Math.max(...activePrediction.top_factors.map((f) => Math.abs(f.shap_value)), 0.01);
                  const widthPercent = `${(Math.abs(factor.shap_value) / maxImpact) * 100}%`;
                  const isPositive = factor.direction === 'positive' || factor.shap_value > 0;
                  
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300 capitalize">{factor.feature.replace(/_/g, ' ')} ({factor.input_value})</span>
                        <span className={`font-mono font-semibold ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isPositive ? '+' : ''}{factor.shap_value.toFixed(4)}
                        </span>
                      </div>
                      
                      <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                        {/* Empty spacing on left for visual alignment if negative, but since our factors mostly positive we display simple colored bar */}
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

              {/* Interpretation Note */}
              <div className="mt-6 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                {activePrediction.interpretation_note}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Recommended Clinical Actions</h3>
              <div className="space-y-4">
                {activePrediction.recommendations.map((rec) => (
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
      )}
    </div>
  );
};

export default PredictDiabetes;
