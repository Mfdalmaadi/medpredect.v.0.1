import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export interface Notification {
  id: string;
  user_id: string;
  prediction_id: string | null;
  type: 'alert_high_risk' | 'reminder_consult' | 'goal_achieved';
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationState {
  items: Notification[];
  total: number;
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  total: 0,
  unreadCount: 0,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (arg: { skip?: number; limit?: number; unreadOnly?: boolean } | void, { rejectWithValue }) => {
    try {
      const { skip = 0, limit = 100, unreadOnly = false } = arg || {};
      const response = await apiClient.get('/notifications', { params: { skip, limit, unread_only: unreadOnly } });
      return response.data; // { items: Notification[], total: number, unread_count: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch notifications.');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markRead',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/notifications/${id}/read`);
      return response.data.notification as Notification;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to mark notification as read.');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload);
      state.total += 1;
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.unreadCount = action.payload.unread_count;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // markRead
      .addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<Notification>) => {
        state.items = state.items.map((n) => (n.id === action.payload.id ? action.payload : n));
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
