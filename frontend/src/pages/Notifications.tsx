import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Loader2, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchNotifications, markNotificationAsRead } from '../store/slices/notificationSlice';

const Notifications: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, unreadCount, loading, error } = useAppSelector((state) => state.notifications);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 100, unreadOnly: showUnreadOnly }));
  }, [dispatch, showUnreadOnly]);

  const filteredItems = items.filter((item) =>
    item.message.toLowerCase().includes(query.toLowerCase()) ||
    item.type.toLowerCase().includes(query.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            <Bell className="h-7 w-7 text-blue-600 dark:text-blue-300" />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review clinical alerts, reminders, and prediction updates.
          </p>
        </div>
        <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
          {unreadCount} unread
        </div>
      </div>

      <div className="clinical-card flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notification text or type..."
            className="clinical-input pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowUnreadOnly((value) => !value)}
          className={showUnreadOnly ? 'clinical-button-primary' : 'clinical-button-secondary'}
        >
          {showUnreadOnly ? 'Unread only' : 'All notifications'}
        </button>
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
      ) : filteredItems.length === 0 ? (
        <div className="clinical-empty">No notifications match the current view.</div>
      ) : (
        <div className="clinical-card divide-y divide-slate-100 overflow-hidden dark:divide-slate-800/70">
          {filteredItems.map((notification) => (
            <div
              key={notification.id}
              className={`flex flex-col gap-4 p-5 transition sm:flex-row sm:items-center sm:justify-between ${
                notification.is_read ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/70 dark:bg-blue-500/5'
              }`}
            >
              <div className="flex min-w-0 gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                      {notification.type.replace(/_/g, ' ')}
                    </span>
                    {!notification.is_read && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-800 dark:text-slate-200">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
              </div>

              {!notification.is_read && (
                <button
                  type="button"
                  onClick={() => dispatch(markNotificationAsRead(notification.id))}
                  className="clinical-button-secondary shrink-0"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
