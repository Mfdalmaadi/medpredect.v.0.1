import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Recommendation {
  id: string;
  prediction_id: string;
  category: 'diet' | 'exercise' | 'lifestyle' | 'consultation' | 'follow_up';
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ShapValue {
  id: string;
  prediction_id: string;
  feature_name: string;
  input_value: number;
  shap_value: number;
  absolute_impact: number;
  direction: 'positive' | 'negative' | 'neutral';
}

export interface PredictionDetail {
  id: string;
  patient_id: string;
  doctor_id: string;
  disease_type: 'diabetes' | 'pcos';
  probability: number;
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  diabetes_input?: any;
  pcos_input?: any;
  recommendations: Recommendation[];
  shap_values: ShapValue[];
}

export interface PredictionResponse {
  prediction_id: string;
  patient_id: string;
  doctor_id: string;
  disease_type: 'diabetes' | 'pcos';
  probability: number;
  risk_level: 'low' | 'medium' | 'high';
  top_factors: Array<{
    feature: string;
    input_value: number;
    shap_value: number;
    absolute_impact: number;
    direction: string;
  }>;
  recommendations: Recommendation[];
  notification_created: boolean;
  interpretation_note: string;
}

interface PredictionState {
  historyItems: PredictionDetail[];
  historyTotal: number;
  activePrediction: PredictionResponse | null;
  currentPredictionDetail: PredictionDetail | null;
  loading: boolean;
  error: string | null;
}

const initialState: PredictionState = {
  historyItems: [],
  historyTotal: 0,
  activePrediction: null,
  currentPredictionDetail: null,
  loading: false,
  error: null,
};

export const predictDiabetes = createAsyncThunk(
  'predictions/predictDiabetes',
  async (payload: { patient_id: string; clinical_input: any; top_n?: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/predict/diabetes', payload);
      return response.data as PredictionResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Diabetes prediction failed.');
    }
  }
);

export const predictPcos = createAsyncThunk(
  'predictions/predictPcos',
  async (payload: { patient_id: string; clinical_input: any; top_n?: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/predict/pcos', payload);
      return response.data as PredictionResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'PCOS prediction failed.');
    }
  }
);

export const fetchDoctorHistory = createAsyncThunk(
  'predictions/fetchDoctorHistory',
  async (arg: { skip?: number; limit?: number } | void, { rejectWithValue }) => {
    try {
      const { skip = 0, limit = 100 } = arg || {};
      const response = await apiClient.get('/predictions/doctor/history', { params: { skip, limit } });
      return response.data; // { items: PredictionDetail[], total: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch doctor history.');
    }
  }
);

export const fetchPatientHistory = createAsyncThunk(
  'predictions/fetchPatientHistory',
  async ({ patientId, skip = 0, limit = 100 }: { patientId: string; skip?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/predictions/patient/${patientId}/history`, { params: { skip, limit } });
      return response.data; // { items: PredictionDetail[], total: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch patient history.');
    }
  }
);

export const fetchPredictionById = createAsyncThunk(
  'predictions/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/predictions/${id}`);
      return response.data as PredictionDetail;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch prediction details.');
    }
  }
);

const predictionSlice = createSlice({
  name: 'predictions',
  initialState,
  reducers: {
    clearActivePrediction(state) {
      state.activePrediction = null;
    },
    clearPredictionDetail(state) {
      state.currentPredictionDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // predictDiabetes
      .addCase(predictDiabetes.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.activePrediction = null;
      })
      .addCase(predictDiabetes.fulfilled, (state, action: PayloadAction<PredictionResponse>) => {
        state.loading = false;
        state.activePrediction = action.payload;
      })
      .addCase(predictDiabetes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // predictPcos
      .addCase(predictPcos.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.activePrediction = null;
      })
      .addCase(predictPcos.fulfilled, (state, action: PayloadAction<PredictionResponse>) => {
        state.loading = false;
        state.activePrediction = action.payload;
      })
      .addCase(predictPcos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchDoctorHistory
      .addCase(fetchDoctorHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.historyItems = action.payload.items;
        state.historyTotal = action.payload.total;
      })
      .addCase(fetchDoctorHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchPatientHistory
      .addCase(fetchPatientHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.historyItems = action.payload.items;
        state.historyTotal = action.payload.total;
      })
      .addCase(fetchPatientHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchById
      .addCase(fetchPredictionById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentPredictionDetail = null;
      })
      .addCase(fetchPredictionById.fulfilled, (state, action: PayloadAction<PredictionDetail>) => {
        state.loading = false;
        state.currentPredictionDetail = action.payload;
      })
      .addCase(fetchPredictionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearActivePrediction, clearPredictionDetail } = predictionSlice.actions;
export default predictionSlice.reducer;
