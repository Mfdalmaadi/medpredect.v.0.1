import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import { UserProfile } from './authSlice';

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  ip_address: string;
  details: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  users_by_role: Record<string, number>;
  total_patients: number;
  total_predictions: number;
  predictions_by_disease: Record<string, number>;
}

interface AdminState {
  users: UserProfile[];
  usersTotal: number;
  auditLogs: AuditLog[];
  auditLogsTotal: number;
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  users: [],
  usersTotal: 0,
  auditLogs: [],
  auditLogsTotal: 0,
  stats: null,
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (arg: { skip?: number; limit?: number } | void, { rejectWithValue }) => {
    try {
      const { skip = 0, limit = 100 } = arg || {};
      const response = await apiClient.get('/admin/users', { params: { skip, limit } });
      return response.data; // { items: UserProfile[], total: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch users list.');
    }
  }
);

export const enableUser = createAsyncThunk(
  'admin/enableUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/enable`);
      return response.data.user as UserProfile;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to enable user account.');
    }
  }
);

export const disableUser = createAsyncThunk(
  'admin/disableUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/disable`);
      return response.data.user as UserProfile;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to disable user account.');
    }
  }
);

export const fetchAuditLogs = createAsyncThunk(
  'admin/fetchAuditLogs',
  async (arg: { skip?: number; limit?: number } | void, { rejectWithValue }) => {
    try {
      const { skip = 0, limit = 100 } = arg || {};
      const response = await apiClient.get('/admin/audit-logs', { params: { skip, limit } });
      return response.data; // { items: AuditLog[], total: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch audit logs.');
    }
  }
);

export const fetchAdminStats = createAsyncThunk(
  'admin/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/admin/stats');
      return response.data as AdminStats;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch admin stats.');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.items;
        state.usersTotal = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // enableUser
      .addCase(enableUser.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.users = state.users.map((u) => (u.id === action.payload.id ? action.payload : u));
      })
      // disableUser
      .addCase(disableUser.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.users = state.users.map((u) => (u.id === action.payload.id ? action.payload : u));
      })
      // fetchAuditLogs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.auditLogs = action.payload.items;
        state.auditLogsTotal = action.payload.total;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchAdminStats
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action: PayloadAction<AdminStats>) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default adminSlice.reducer;
