import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchPatients } from '../store/slices/patientSlice';
import { predictPcos, clearActivePrediction } from '../store/slices/predictionSlice';
import apiClient from '../api/client';
import { 
  HeartPulse, 
  User, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  CheckCircle,
  FileDown
} from 'lucide-react';

const PredictPcos: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const routePatientId = location.state?.patientId as string | undefined;

  const { items: patients } = useAppSelector((state) => state.patients);
  const { activePrediction, loading: predicting, error } = useAppSelector((state) => state.predictions);

  const [selectedPatientId, setSelectedPatientId] = useState(routePatientId || '');
  
  // PCOS Form Fields
  const [age, setAge] = useState('28');
  const [bmi, setBmi] = useState('24.5');
  const [cycleRegularity, setCycleRegularity] = useState(true); // Default to regular
  const [acne, setAcne] = useState(false);
  const [hairLoss, setHairLoss] = useState(false);
  const [hirsutism, setHirsutism] = useState(false);
  const [insulinResistance, setInsulinResistance] = useState('1.5');
  const [lhFshRatio, setLhFshRatio] = useState('1.1');
  const [follicleSize, setFollicleSize] = useState('10.0');

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
        age: parseInt(age),
        bmi: parseFloat(bmi),
        cycle_regularity: cycleRegularity,
        acne,
        hair_loss: hairLoss,
        hirsutism,
        insulin_resistance: parseFloat(insulinResistance),
        lh_fsh_ratio: parseFloat(lhFshRatio),
        follicle_size: parseFloat(follicleSize),
      },
    };

    dispatch(predictPcos(payload));
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
          <HeartPulse className="h-7 w-7 text-pink-500" />
          PCOS Risk Assessment
        </h1>
        <p className="text-slate-400 text-sm mt-1">Submit patient clinical signs to check PCOS probability (Clinical Scoring Engine)</p>
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
              {/* Age */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Age (Years)
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

              {/* BMI */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Body Mass Index (BMI)
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

              {/* Insulin Resistance */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Insulin Resistance Index (HOMA-IR)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  max="100"
                  value={insulinResistance}
                  onChange={(e) => setInsulinResistance(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* LH/FSH Ratio */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  LH / FSH Ratio
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  max="50"
                  value={lhFshRatio}
                  onChange={(e) => setLhFshRatio(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Follicle Size */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  Mean Follicle Size (mm)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  max="100"
                  value={follicleSize}
                  onChange={(e) => setFollicleSize(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Cycle Regularity (Toggle Switch) */}
              <div className="flex items-center justify-between p-4 bg-slate-950/30 border border-slate-800/80 rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Menstrual Cycle Regularity</span>
                  <span className="text-[10px] text-slate-500">Enable if the patient's cycle is regular</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCycleRegularity(!cycleRegularity)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    cycleRegularity ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      cycleRegularity ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Booleans Row */}
              <div className="md:col-span-2 grid grid-cols-3 gap-4 bg-slate-950/30 border border-slate-800/80 p-4 rounded-xl">
                {/* Acne */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acne}
                    onChange={(e) => setAcne(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block">Clinical Acne</span>
                    <span className="text-[9px] text-slate-500">Moderate/Severe</span>
                  </div>
                </label>

                {/* Hair Loss */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hairLoss}
                    onChange={(e) => setHairLoss(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block">Hair Loss</span>
                    <span className="text-[9px] text-slate-500">Female Pattern Alopecia</span>
                  </div>
                </label>

                {/* Hirsutism */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hirsutism}
                    onChange={(e) => setHirsutism(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block">Hirsutism</span>
                    <span className="text-[9px] text-slate-500">Excessive Hair Growth</span>
                  </div>
                </label>
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
                className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow shadow-pink-600/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm"
              >
                {predicting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating Score...
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
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">clinical score</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${
                getRiskLevelStyles(activePrediction.risk_level).bg
              } ${getRiskLevelStyles(activePrediction.risk_level).text} ${getRiskLevelStyles(activePrediction.risk_level).border}`}>
                {activePrediction.risk_level} Risk Level
              </span>
              <p className="text-xs text-slate-400 max-w-64 leading-relaxed pt-2">
                PCOS risk based on scoring of criteria. Refer to gynecological follow-up details.
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
            {/* Contributing factors panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Diagnostic Indicator Contributions</h3>
              
              <div className="space-y-4">
                {activePrediction.top_factors.map((factor, index) => {
                  const maxImpact = Math.max(...activePrediction.top_factors.map((f) => Math.abs(f.shap_value)), 0.01);
                  const widthPercent = `${(Math.abs(factor.shap_value) / maxImpact) * 100}%`;
                  const isPositive = factor.direction === 'positive' || factor.shap_value > 0;
                  
                  // Helper to convert internal booleans to text
                  let displayVal = `${factor.input_value}`;
                  if (factor.feature === 'cycle_regularity') {
                    displayVal = factor.input_value === 0 ? 'Irregular' : 'Regular';
                  } else if (['acne', 'hair_loss', 'hirsutism'].includes(factor.feature)) {
                    displayVal = factor.input_value === 1 ? 'Present' : 'Absent';
                  }

                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300 capitalize">
                          {factor.feature.replace(/_/g, ' ')} ({displayVal})
                        </span>
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

export default PredictPcos;
