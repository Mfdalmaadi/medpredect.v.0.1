import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Patient {
  id: string;
  doctor_id: string;
  first_name: string;
  last_name: string;
  medical_identifier: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PatientState {
  items: Patient[];
  total: number;
  currentPatient: Patient | null;
  loading: boolean;
  error: string | null;
}

const initialState: PatientState = {
  items: [],
  total: 0,
  currentPatient: null,
  loading: false,
  error: null,
};

export const fetchPatients = createAsyncThunk(
  'patients/fetchAll',
  async (arg: { skip?: number; limit?: number } | void, { rejectWithValue }) => {
    try {
      const { skip = 0, limit = 100 } = arg || {};
      const response = await apiClient.get('/patients', { params: { skip, limit } });
      return response.data; // { items: Patient[], total: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch patients.');
    }
  }
);

export const fetchPatientById = createAsyncThunk(
  'patients/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/patients/${id}`);
      return response.data as Patient;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch patient details.');
    }
  }
);

export const createPatient = createAsyncThunk(
  'patients/create',
  async (patientData: Omit<Patient, 'id' | 'doctor_id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/patients', patientData);
      return response.data as Patient;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create patient.');
    }
  }
);

export const updatePatient = createAsyncThunk(
  'patients/update',
  async ({ id, data }: { id: string; data: Partial<Omit<Patient, 'id' | 'doctor_id'>> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/patients/${id}`, data);
      return response.data as Patient;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update patient.');
    }
  }
);

export const deletePatient = createAsyncThunk(
  'patients/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/patients/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete patient.');
    }
  }
);

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearCurrentPatient(state) {
      state.currentPatient = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchById
      .addCase(fetchPatientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action: PayloadAction<Patient>) => {
        state.loading = false;
        state.currentPatient = action.payload;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // create
      .addCase(createPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPatient.fulfilled, (state, action: PayloadAction<Patient>) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // update
      .addCase(updatePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePatient.fulfilled, (state, action: PayloadAction<Patient>) => {
        state.loading = false;
        state.items = state.items.map((p) => (p.id === action.payload.id ? action.payload : p));
        if (state.currentPatient?.id === action.payload.id) {
          state.currentPatient = action.payload;
        }
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // delete
      .addCase(deletePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePatient.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.items = state.items.filter((p) => p.id !== action.payload);
        state.total -= 1;
        if (state.currentPatient?.id === action.payload) {
          state.currentPatient = null;
        }
      })
      .addCase(deletePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentPatient } = patientSlice.actions;
export default patientSlice.reducer;
