import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  doctor_profile?: {
    id: string;
    user_id: string;
    specialization: string;
    license_number: string;
    hospital: string;
    created_at: string;
    updated_at: string;
  } | null;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  registrationMessage: string | null;
}

// Initial state reading from localStorage to preserve session across reloads
const storedUser = localStorage.getItem('user');
const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,
  registrationMessage: null,
};

const getErrorMessage = (error: any, fallback: string) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message)
      .filter(Boolean)
      .join(' ');
  }
  return fallback;
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { access_token, refresh_token, user } = response.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return user as UserProfile;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Login failed. Please check your credentials.'));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    userData: {
      email: string;
      password: string;
      role: string;
      specialization: string;
      license_number: string;
      hospital: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return {
        user: response.data.user as UserProfile,
        message: response.data.message as string,
      };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Registration failed. Try again.'));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_: void, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      // Continue cleanup even if server logout fails
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearRegistrationMessage(state) {
      state.registrationMessage = null;
    },
    forceLogout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.registrationMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registrationMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<{ user: UserProfile; message: string }>) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.registrationMessage = action.payload.message;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, clearRegistrationMessage, forceLogout } = authSlice.actions;
export default authSlice.reducer;
